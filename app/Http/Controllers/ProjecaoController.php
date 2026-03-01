<?php

namespace App\Http\Controllers;

use App\Models\CardUser;
use App\Models\Category;
use App\Models\Transacao;
use App\Services\FaturaBillingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjecaoController extends Controller
{
    public function __construct(private FaturaBillingService $billing) {}

    public function index(Request $request): Response
    {
        $user = $request->user();

        $bankAccounts = CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(fn ($cu) => [
                'id'   => $cu->id,
                'name' => $cu->card?->name ?? ('Cartão #' . $cu->id),
            ]);

        $categories = Category::forUser($user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color']);

        $now        = Carbon::now();
        $monthStart = $now->copy()->startOfMonth();
        $monthEnd   = $now->copy()->endOfMonth();
        $today      = $now->copy()->startOfMonth();

        $currentMonthDebit = Transacao::where('user_id', $user->id)
            ->where('type', 'debit')
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->sum('amount');

        // Fetch ALL credit transactions — same scope as the fatura page
        $allCreditTxs = Transacao::with(['bankUser.card', 'category'])
            ->where('user_id', $user->id)
            ->where('type', 'credit')
            ->orderByDesc('created_at')
            ->get();

        $creditTransactions = $allCreditTxs->map(function ($tx) use ($today) {
            $totalInstallments = max((int) ($tx->total_installments ?? 1), 1);
            $isRecurring       = (bool) $tx->is_recurring;
            $amountPerMonth    = round((float) $tx->amount / $totalInstallments, 2);

            // Use the exact same billing-month resolution as FaturaBillingService
            $firstBillingMonthKey = $this->billing->resolveBillingMonthKey($tx);
            $firstBillingMonth    = Carbon::createFromFormat('Y-m', $firstBillingMonthKey)->startOfMonth();

            $completionMonth = null;
            if (!$isRecurring) {
                $completionCarbon = $firstBillingMonth->copy()->addMonths($totalInstallments - 1);
                $completionMonth  = $completionCarbon->format('Y-m');

                // Skip transactions that finished before the current month
                if ($completionCarbon->lt($today)) {
                    return null;
                }
            }

            return [
                'id'                  => $tx->id,
                'title'               => $tx->title,
                'amount'              => (float) $tx->amount,
                'amount_per_month'    => $amountPerMonth,
                'is_recurring'        => $isRecurring,
                'total_installments'  => $totalInstallments,
                'first_billing_month' => $firstBillingMonthKey,
                'completion_month'    => $completionMonth,
                'bank_user_id'        => $tx->bankUser?->id,
                'bank_name'           => $tx->bankUser?->card?->name,
                'category_id'         => $tx->category?->id,
                'category_name'       => $tx->category?->name,
                'category_icon'       => $tx->category?->icon,
                'category_color'      => $tx->category?->color,
            ];
        })->filter()->values();

        return Inertia::render('Projecao', [
            'creditTransactions' => $creditTransactions,
            'bankAccounts'       => $bankAccounts,
            'categories'         => $categories,
            'currentMonthStats'  => [
                'debit' => (float) $currentMonthDebit,
                'month' => $now->format('Y-m'),
            ],
        ]);
    }
}


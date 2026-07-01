<?php

namespace App\Http\Controllers;

use App\Models\Bill;
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
                'id' => $cu->id,
                'name' => $cu->card?->name ?? ('Cartão #'.$cu->id),
            ]);

        $categories = Category::forUser($user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color']);

        $now = Carbon::now();
        $monthStart = $now->copy()->startOfMonth();
        $monthEnd = $now->copy()->endOfMonth();
        $today = $now->copy()->startOfMonth();

        $currentMonthDebit = Transacao::where('user_id', $user->id)
            ->where('type', 'debit')
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->sum('amount');

        $allCreditTxs = Transacao::with(['bankUser.card', 'category', 'parcelas'])
            ->where('user_id', $user->id)
            ->where('type', 'credit')
            ->orderByDesc('created_at')
            ->get();

        $creditTransactions = $allCreditTxs->map(function ($tx) use ($today) {
            $totalInstallments = max((int) ($tx->total_installments ?? 1), 1);
            $isRecurring = (bool) $tx->is_recurring;
            $amountPerMonth = (float) $tx->getInstallmentAmount();

            $firstBillingMonthKey = $this->billing->resolveBillingMonthKey($tx);
            $firstBillingMonth = Carbon::parse($firstBillingMonthKey.'-01');

            $completionMonth = null;
            if (! $isRecurring) {
                $completionCarbon = $firstBillingMonth->copy()->addMonths($totalInstallments - 1);
                $completionMonth = $completionCarbon->format('Y-m');

                if ($completionCarbon->lt($today)) {
                    return null;
                }
            }

            return [
                'id' => $tx->id,
                'title' => $tx->title,
                'amount' => (float) $tx->amount,
                'amount_per_month' => $amountPerMonth,
                'is_recurring' => $isRecurring,
                'total_installments' => $totalInstallments,
                'first_billing_month' => $firstBillingMonthKey,
                'completion_month' => $completionMonth,
                'bank_user_id' => $tx->bankUser?->id,
                'bank_name' => $tx->bankUser?->card?->name,
                'category_id' => $tx->category?->id,
                'category_name' => $tx->category?->name,
                'category_icon' => $tx->category?->icon,
                'category_color' => $tx->category?->color,
            ];
        })->filter()->values();

        $activeBills = Bill::forUser($user->id)
            ->active()
            ->with('category:id,name,color,icon')
            ->orderBy('due_day')
            ->get()
            ->map(fn ($bill) => [
                'id' => $bill->id,
                'title' => $bill->title,
                'amount' => $bill->amount !== null ? (float) $bill->amount : null,
                'recurrence_type' => $bill->recurrence_type,
                'due_day' => $bill->due_day,
                'start_date' => $bill->start_date?->format('Y-m-d'),
                'end_date' => $bill->end_date?->format('Y-m-d'),
                'color' => $bill->color,
                'icon' => $bill->icon,
                'category_id' => $bill->category?->id,
                'category_name' => $bill->category?->name,
                'category_icon' => $bill->category?->icon,
                'category_color' => $bill->category?->color,
            ]);

        return Inertia::render('Projecao', [
            'creditTransactions' => $creditTransactions,
            'bankAccounts' => $bankAccounts,
            'categories' => $categories,
            'bills' => $activeBills,
            'currentMonthStats' => [
                'debit' => (float) $currentMonthDebit,
                'month' => $now->format('Y-m'),
            ],
        ]);
    }
}

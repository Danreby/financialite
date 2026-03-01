<?php

namespace App\Http\Controllers;

use App\Models\CardUser;
use App\Models\Category;
use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjecaoController extends Controller
{
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

        $currentMonthCredit = Transacao::where('user_id', $user->id)
            ->where('type', 'credit')
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->sum('amount');

        $currentMonthDebit = Transacao::where('user_id', $user->id)
            ->where('type', 'debit')
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->sum('amount');

        $txs = Transacao::with(['bankUser.card', 'category'])
            ->where('user_id', $user->id)
            ->where('total_installments', '>', 1)
            ->orderByDesc('created_at')
            ->get();

        $installments = $txs->map(function ($tx) {
            $totalInstallments  = (int) ($tx->total_installments ?? 1);
            $currentInstallment = (int) ($tx->current_installment ?? 0);
            $remaining          = max($totalInstallments - $currentInstallment, 0);
            $amount             = (float) $tx->amount;
            $installmentAmount  = $totalInstallments > 0
                ? round($amount / $totalInstallments, 2)
                : $amount;

            $createdAt = Carbon::parse($tx->created_at);
            $dueDay    = $tx->bankUser?->due_day ?? 1;

            $firstBillingMonth = $createdAt->day <= $dueDay
                ? $createdAt->copy()->startOfMonth()
                : $createdAt->copy()->addMonth()->startOfMonth();

            $completionDate = $firstBillingMonth->copy()->addMonths($totalInstallments - 1);

            return [
                'id'                     => $tx->id,
                'title'                  => $tx->title,
                'amount'                 => $amount,
                'installment_amount'     => $installmentAmount,
                'total_installments'     => $totalInstallments,
                'current_installment'    => $currentInstallment,
                'remaining_installments' => $remaining,
                'first_billing_month'    => $firstBillingMonth->format('Y-m'),
                'completion_month'       => $completionDate->format('Y-m'),
                'bank_user_id'           => $tx->bankUser?->id,
                'bank_name'              => $tx->bankUser?->card?->name,
                'category_id'            => $tx->category?->id,
                'category_name'          => $tx->category?->name,
                'category_icon'          => $tx->category?->icon,
                'category_color'         => $tx->category?->color,
                'type'                   => $tx->type ?? 'credit',
            ];
        });

        return Inertia::render('Projecao', [
            'installments'        => $installments,
            'bankAccounts'        => $bankAccounts,
            'categories'          => $categories,
            'currentMonthStats'   => [
                'credit' => (float) $currentMonthCredit,
                'debit'  => (float) $currentMonthDebit,
                'month'  => $now->format('Y-m'),
            ],
        ]);
    }
}

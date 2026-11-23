<?php

namespace App\Queries\ResumoMensal;

use App\Enums\TransacaoType;
use App\Models\Transacao;
use App\Services\FaturaBillingService;
use Carbon\Carbon;

/**
 * Fatura do mês por cartão no Resumo mensal: as compras de cada cartão que caem
 * no mês de fatura, com a parcela do mês ("2/3") e o total por cartão.
 */
class ExpensesByCardQuery
{
    public function __construct(private FaturaBillingService $billing) {}

    /**
     * @return list<array{bank_user_id: int, card_name: string, total: float, count: int, transactions: list<array<string, mixed>>}>
     */
    public function get(int $userId, Carbon $month): array
    {
        $monthKey = $month->format('Y-m');

        $credits = Transacao::with(['category', 'bankUser.card', 'parcelas'])
            ->forUser($userId)
            ->where('type', TransacaoType::Credit)
            ->whereNotNull('bank_user_id')
            ->get()
            ->filter(fn (Transacao $t) => $this->billing->faturaAppliesToMonth($t, $month));

        return $credits->groupBy('bank_user_id')
            ->map(function ($items) use ($monthKey) {
                $first = $items->first();

                $transactions = $items
                    ->map(fn (Transacao $t) => $this->row($t, $monthKey))
                    ->sortByDesc('amount')
                    ->values()
                    ->toArray();

                return [
                    'bank_user_id' => $first->bank_user_id,
                    'card_name' => optional($first->bankUser?->card)->name ?? 'Cartão desconhecido',
                    'total' => round(collect($transactions)->sum('amount'), 2),
                    'count' => count($transactions),
                    'transactions' => $transactions,
                ];
            })
            ->sortByDesc('total')
            ->values()
            ->toArray();
    }

    /** @return array<string, mixed> */
    private function row(Transacao $t, string $monthKey): array
    {
        $totalInstallments = max((int) ($t->total_installments ?? 1), 1);

        if (! $t->is_recurring && $t->parcelas->isNotEmpty()) {
            $parcela = $t->parcelas->firstWhere('month_key', $monthKey);
            $installmentNumber = $parcela ? $parcela->installment_number : 1;
        } else {
            $installmentNumber = $this->billing->resolveInstallmentNumberForMonth($t, $monthKey);
        }

        return [
            'id' => $t->id,
            'title' => $t->title,
            'amount' => round($this->billing->installmentAmountForMonth($t, $monthKey), 2),
            'total_amount' => (float) $t->amount,
            'installments' => $totalInstallments > 1
                ? "{$installmentNumber}/{$totalInstallments}"
                : null,
            'category_name' => optional($t->category)->name,
            'category_icon' => optional($t->category)->icon,
            'category_color' => optional($t->category)->color,
            'date' => $t->created_at?->format('d/m'),
            'is_recurring' => (bool) $t->is_recurring,
        ];
    }
}

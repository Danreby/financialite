<?php

namespace App\Queries\ResumoMensal;

use App\Enums\TransacaoType;
use App\Models\Transacao;
use App\Services\FaturaBillingService;
use Carbon\Carbon;

/**
 * Gasto do mês por categoria no Resumo mensal: débitos lançados no mês (pagos ou
 * não) mais a parcela de cada compra no cartão que cai na fatura do mês.
 */
class ExpensesByCategoryQuery
{
    public function __construct(private FaturaBillingService $billing) {}

    /**
     * @return list<array{category_id: int|null, category_name: string, category_icon: string|null, category_color: string|null, total: float, count: int}>
     */
    public function get(int $userId, Carbon $month): array
    {
        $monthKey = $month->format('Y-m');

        $debits = Transacao::with('category')
            ->forUser($userId)
            ->where('type', TransacaoType::Debit)
            ->whereBetween('created_at', [$month, $month->copy()->endOfMonth()])
            ->get();

        $credits = Transacao::with(['category', 'bankUser', 'parcelas'])
            ->forUser($userId)
            ->where('type', TransacaoType::Credit)
            ->get()
            ->filter(fn (Transacao $t) => $this->billing->faturaAppliesToMonth($t, $month));

        $rows = collect();

        foreach ($debits as $t) {
            $rows->push($this->row($t, (float) $t->amount));
        }

        foreach ($credits as $t) {
            $rows->push($this->row($t, $this->billing->installmentAmountForMonth($t, $monthKey)));
        }

        return $rows->groupBy('category_id')
            ->map(function ($items) {
                $first = $items->first();

                return [
                    'category_id' => $first['category_id'],
                    'category_name' => $first['category_name'],
                    'category_icon' => $first['category_icon'],
                    'category_color' => $first['category_color'],
                    'total' => round($items->sum('amount'), 2),
                    'count' => $items->count(),
                ];
            })
            ->sortByDesc('total')
            ->values()
            ->toArray();
    }

    /** @return array<string, mixed> */
    private function row(Transacao $t, float $amount): array
    {
        return [
            'category_id' => $t->category_id,
            'category_name' => optional($t->category)->name ?? 'Sem categoria',
            'category_icon' => optional($t->category)->icon,
            'category_color' => optional($t->category)->color,
            'amount' => $amount,
        ];
    }
}

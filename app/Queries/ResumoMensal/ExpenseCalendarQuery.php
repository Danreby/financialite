<?php

namespace App\Queries\ResumoMensal;

use App\Enums\TransacaoType;
use App\Models\Transacao;
use App\Services\FaturaBillingService;
use Carbon\Carbon;

/**
 * Calendário do Resumo mensal: um item por dia do mês com os lançamentos feitos
 * naquele dia (débitos e compras no cartão pela data da compra). A compra no
 * cartão aparece com o valor da parcela que cai na fatura do mês.
 */
class ExpenseCalendarQuery
{
    public function __construct(private FaturaBillingService $billing) {}

    /**
     * @return list<array{date: string, day: int, weekday: int, transactions: list<array<string, mixed>>, total: float, count: int}>
     */
    public function get(int $userId, Carbon $month): array
    {
        $monthKey = $month->format('Y-m');
        $monthEnd = $month->copy()->endOfMonth();

        $debits = Transacao::with(['category', 'bankUser.card'])
            ->forUser($userId)
            ->where('type', TransacaoType::Debit)
            ->whereBetween('created_at', [$month, $monthEnd])
            ->orderByDesc('created_at')
            ->get();

        $credits = Transacao::with(['category', 'bankUser.card', 'parcelas'])
            ->forUser($userId)
            ->where('type', TransacaoType::Credit)
            ->whereBetween('created_at', [$month, $monthEnd])
            ->orderByDesc('created_at')
            ->get();

        $byDay = $debits->merge($credits)->groupBy(fn (Transacao $t) => $t->created_at->format('Y-m-d'));

        $days = [];
        $cursor = $month->copy();

        while ($cursor->lte($monthEnd)) {
            $dateKey = $cursor->format('Y-m-d');

            $items = $byDay->get($dateKey, collect())->map(fn (Transacao $t) => [
                'id' => $t->id,
                'title' => $t->title,
                'amount' => round($t->type === TransacaoType::Credit
                    ? $this->billing->installmentAmountForMonth($t, $monthKey)
                    : (float) $t->amount, 2),
                'type' => $t->type->value,
                'status' => $t->status->value,
                'category_name' => optional($t->category)->name,
                'category_icon' => optional($t->category)->icon,
                'category_color' => optional($t->category)->color,
                'bank_name' => optional($t->bankUser?->card)->name,
            ])->values()->toArray();

            $days[] = [
                'date' => $dateKey,
                'day' => (int) $cursor->format('d'),
                'weekday' => $cursor->dayOfWeek,
                'transactions' => $items,
                'total' => round(collect($items)->sum('amount'), 2),
                'count' => count($items),
            ];

            $cursor->addDay();
        }

        return $days;
    }
}

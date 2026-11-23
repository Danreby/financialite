<?php

namespace App\Queries\ResumoMensal;

use App\Enums\TransacaoType;
use App\Models\Transacao;
use App\Services\FaturaBillingService;
use Carbon\Carbon;

/**
 * Gasto do mês por categoria comparado com a média dos últimos quatro meses
 * (o mês e os três anteriores), contando débitos e parcelas de cartão. A média
 * divide sempre por 4, mesmo que a categoria só apareça em parte dos meses.
 */
class CategoryAveragesQuery
{
    private const MONTH_COUNT = 4;

    public function __construct(private FaturaBillingService $billing) {}

    /**
     * @return list<array{category_id: int|null, category_name: string, category_icon: string|null, category_color: string|null, current_total: float|int, average: float, diff: float, diff_percent: float|int}>
     */
    public function get(int $userId, Carbon $month): array
    {
        $windowStart = $month->copy()->subMonthsNoOverflow(self::MONTH_COUNT - 1)->startOfMonth();

        $monthKeys = [];
        $cursor = $windowStart->copy();
        while ($cursor->lte($month)) {
            $monthKeys[] = $cursor->format('Y-m');
            $cursor->addMonthNoOverflow();
        }

        $debits = Transacao::with('category')
            ->forUser($userId)
            ->where('type', TransacaoType::Debit)
            ->whereBetween('created_at', [$windowStart, $month->copy()->endOfMonth()])
            ->get();

        $credits = Transacao::with(['category', 'bankUser', 'parcelas'])
            ->forUser($userId)
            ->where('type', TransacaoType::Credit)
            ->get();

        $rows = collect();

        foreach ($debits as $t) {
            $rows->push($this->row($t, $t->created_at->format('Y-m'), (float) $t->amount));
        }

        foreach ($credits as $t) {
            if (! $t->is_recurring && $t->parcelas->isNotEmpty()) {
                foreach ($t->parcelas->whereIn('month_key', $monthKeys) as $parcela) {
                    $rows->push($this->row($t, $parcela->month_key, (float) $t->getInstallmentAmount($parcela->installment_number)));
                }

                continue;
            }

            foreach ($monthKeys as $mk) {
                if ($this->billing->faturaAppliesToMonth($t, Carbon::parse($mk.'-01'))) {
                    $installmentNumber = $this->billing->resolveInstallmentNumberForMonth($t, $mk);
                    $rows->push($this->row($t, $mk, (float) $t->getInstallmentAmount($installmentNumber)));
                }
            }
        }

        $currentMonthByCategory = $rows
            ->filter(fn ($r) => $r['month_key'] === $month->format('Y-m'))
            ->groupBy('category_id')
            ->map(fn ($items) => round($items->sum('amount'), 2));

        return $rows->groupBy('category_id')
            ->map(function ($items) use ($currentMonthByCategory) {
                $first = $items->first();
                $average = round($items->sum('amount') / self::MONTH_COUNT, 2);
                $currentTotal = $currentMonthByCategory->get($first['category_id'], 0);
                $diff = round($currentTotal - $average, 2);

                return [
                    'category_id' => $first['category_id'],
                    'category_name' => $first['category_name'],
                    'category_icon' => $first['category_icon'],
                    'category_color' => $first['category_color'],
                    'current_total' => $currentTotal,
                    'average' => $average,
                    'diff' => $diff,
                    'diff_percent' => $average > 0 ? round(($diff / $average) * 100, 1) : 0,
                ];
            })
            ->sortByDesc('current_total')
            ->values()
            ->toArray();
    }

    /** @return array<string, mixed> */
    private function row(Transacao $t, string $monthKey, float $amount): array
    {
        return [
            'category_id' => $t->category_id,
            'category_name' => optional($t->category)->name ?? 'Sem categoria',
            'category_icon' => optional($t->category)->icon,
            'category_color' => optional($t->category)->color,
            'month_key' => $monthKey,
            'amount' => $amount,
        ];
    }
}

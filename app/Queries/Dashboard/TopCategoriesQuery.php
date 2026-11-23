<?php

namespace App\Queries\Dashboard;

use App\Enums\TransacaoStatus;
use App\Enums\TransacaoType;
use App\Models\Transacao;
use App\Services\FaturaBillingService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Onde o dinheiro foi: gasto por categoria (geral, só débito, só crédito) e a
 * divisão entre recorrente e avulso.
 *
 * Débito entra pelo valor, só os pagos. Crédito entra pela parcela que cai no
 * mês de fatura, paga ou não.
 */
class TopCategoriesQuery
{
    public function __construct(private FaturaBillingService $billing) {}

    /**
     * Um mês de fatura (o card "Maiores gastos" do Dashboard, no mês corrente).
     *
     * @return array{top_spending_categories: list<array<string, mixed>>, debit_spending_categories: list<array<string, mixed>>, credit_spending_categories: list<array<string, mixed>>, recurring_spending: array{total: float, percentage: float|int}, non_recurring_spending: array{total: float, percentage: float|int}}
     */
    public function forInvoiceMonth(int $userId, ?int $bankUserId, ?int $categoryId, string $monthKey, Carbon $targetMonth): array
    {
        $base = $this->base($userId, $bankUserId, $categoryId);

        $debitRows = $this->paidDebits($base, $targetMonth, $targetMonth->copy()->endOfMonth())
            ->map(fn (Transacao $t) => $this->row($t, (float) $t->amount))
            ->values()->all();

        $creditRows = $this->credits($base)
            ->filter(fn (Transacao $t) => $this->billing->faturaAppliesToMonth($t, $targetMonth))
            ->map(fn (Transacao $t) => $this->row($t, $this->billing->installmentAmountForMonth($t, $monthKey)))
            ->values()->all();

        return $this->summarize($debitRows, $creditRows);
    }

    /**
     * Um intervalo de meses (GET /transacoes/top-spending-by-period e
     * /api/v1/transacoes/top-spending). Cada compra soma as parcelas que caem no
     * intervalo; recorrente soma uma vez por mês em que vale.
     *
     * @param  string  $monthFrom  Y-m
     * @param  string  $monthTo  Y-m
     * @return array<string, mixed>
     */
    public function forPeriod(int $userId, string $monthFrom, string $monthTo, ?int $bankUserId = null, ?int $categoryId = null): array
    {
        $startMonth = Carbon::parse($monthFrom.'-01');
        $endMonth = Carbon::parse($monthTo.'-01')->endOfMonth();

        $base = $this->base($userId, $bankUserId, $categoryId);

        $monthKeys = [];
        $cursor = $startMonth->copy()->startOfMonth();
        $limit = $endMonth->copy()->startOfMonth();
        while ($cursor->lte($limit)) {
            $monthKeys[] = $cursor->format('Y-m');
            $cursor->addMonthNoOverflow();
        }

        $debitRows = $this->paidDebits($base, $startMonth, $endMonth)
            ->map(fn (Transacao $t) => $this->row($t, (float) $t->amount))
            ->values()->all();

        $creditRows = $this->credits($base)
            ->flatMap(function (Transacao $t) use ($monthKeys) {
                if (! $t->is_recurring && $t->parcelas->isNotEmpty()) {
                    $total = $t->parcelas->whereIn('month_key', $monthKeys)->sum('amount');

                    return $total > 0 ? [$this->row($t, (float) $total)] : [];
                }

                $count = collect($monthKeys)
                    ->filter(fn (string $mk) => $this->billing->faturaAppliesToMonth($t, Carbon::parse($mk.'-01')))
                    ->count();

                return $count > 0 ? [$this->row($t, (float) $t->getInstallmentAmount() * $count)] : [];
            })
            ->values()->all();

        $summary = $this->summarize($debitRows, $creditRows);

        $locale = config('app.locale', 'pt_BR');
        $fromLabel = ucfirst(Carbon::parse($monthFrom.'-01')->locale($locale)->translatedFormat('M Y'));
        $toLabel = ucfirst(Carbon::parse($monthTo.'-01')->locale($locale)->translatedFormat('M Y'));

        return [
            'top_spending_categories' => $summary['top_spending_categories'],
            'debit_spending_categories' => $summary['debit_spending_categories'],
            'credit_spending_categories' => $summary['credit_spending_categories'],
            'period_label' => $monthFrom === $monthTo ? $fromLabel : "{$fromLabel} — {$toLabel}",
            'recurring_spending' => $summary['recurring_spending'],
            'non_recurring_spending' => $summary['non_recurring_spending'],
        ];
    }

    /** @return Builder<Transacao> */
    private function base(int $userId, ?int $bankUserId, ?int $categoryId): Builder
    {
        return Transacao::forUser($userId)
            ->forBankUser($bankUserId)
            ->when($categoryId, fn ($q, $categoryId) => $q->where('category_id', $categoryId));
    }

    /**
     * @param  Builder<Transacao>  $base
     * @return Collection<int, Transacao>
     */
    private function paidDebits(Builder $base, Carbon $from, Carbon $to): Collection
    {
        return (clone $base)
            ->with('category')
            ->where('type', TransacaoType::Debit)
            ->where('status', TransacaoStatus::Paid)
            ->whereBetween('created_at', [$from, $to])
            ->get();
    }

    /**
     * @param  Builder<Transacao>  $base
     * @return Collection<int, Transacao>
     */
    private function credits(Builder $base): Collection
    {
        return (clone $base)
            ->with(['category', 'bankUser', 'parcelas'])
            ->where('type', TransacaoType::Credit)
            ->get();
    }

    /** @return array<string, mixed> */
    private function row(Transacao $t, float $amount): array
    {
        return [
            'category_id' => $t->category_id,
            'category_name' => optional($t->category)->name,
            'category_icon' => optional($t->category)->icon,
            'category_color' => optional($t->category)->color,
            'amount' => $amount,
            'is_recurring' => $t->is_recurring,
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $debitRows
     * @param  list<array<string, mixed>>  $creditRows
     * @return array{top_spending_categories: list<array<string, mixed>>, debit_spending_categories: list<array<string, mixed>>, credit_spending_categories: list<array<string, mixed>>, recurring_spending: array{total: float, percentage: float|int}, non_recurring_spending: array{total: float, percentage: float|int}}
     */
    private function summarize(array $debitRows, array $creditRows): array
    {
        $allRows = collect($debitRows)->merge($creditRows);

        $totalRecurring = $allRows->where('is_recurring', true)->sum('amount');
        $totalNonRecurring = $allRows->where('is_recurring', false)->sum('amount');
        $totalAmount = $totalRecurring + $totalNonRecurring;

        return [
            'top_spending_categories' => $this->byCategory($allRows),
            'debit_spending_categories' => $this->byCategory(collect($debitRows)),
            'credit_spending_categories' => $this->byCategory(collect($creditRows)),
            'recurring_spending' => [
                'total' => (float) $totalRecurring,
                'percentage' => $totalAmount > 0 ? round(($totalRecurring / $totalAmount) * 100, 1) : 0,
            ],
            'non_recurring_spending' => [
                'total' => (float) $totalNonRecurring,
                'percentage' => $totalAmount > 0 ? round(($totalNonRecurring / $totalAmount) * 100, 1) : 0,
            ],
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    private function byCategory(Collection $rows): array
    {
        return $rows
            ->groupBy('category_id')
            ->map(function ($items) {
                $first = $items->first();

                return [
                    'category_id' => $first['category_id'] ?? null,
                    'category_name' => $first['category_name'] ?? 'Sem categoria',
                    'category_icon' => $first['category_icon'] ?? null,
                    'category_color' => $first['category_color'] ?? null,
                    'total' => (float) $items->sum('amount'),
                ];
            })
            ->sortByDesc('total')
            ->values()
            ->all();
    }
}

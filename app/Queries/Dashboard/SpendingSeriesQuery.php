<?php

namespace App\Queries\Dashboard;

use App\Enums\TransacaoType;
use App\Models\Transacao;
use App\Services\FaturaBillingService;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Série mensal de gastos (monthly_summary do stats): para cada mês, o total
 * pago da fatura, o crédito que cai naquele mês de fatura e os débitos do mês.
 *
 * O KPI "Total mensal" do front soma credit_total + debit_total do mês atual,
 * com o crédito pago incluído. Tendências (spending_trends, em
 * DashboardInsightsService) deixa o crédito pago de fora, por isso os dois
 * números diferem quando há fatura paga no mês. É decisão de produto: não
 * alinhar sem combinar antes.
 */
class SpendingSeriesQuery
{
    public function __construct(private FaturaBillingService $billing) {}

    /**
     * @param  Collection<array-key, mixed>|iterable<array-key, mixed>  $paidByMonth  saída de PaidInvoicesByMonthQuery
     * @return list<array{month_key: string, month_label: string, invoice_total: float, credit_total: float, debit_total: float}>
     */
    public function get(
        int $userId,
        ?int $bankUserId,
        ?int $categoryId,
        Carbon $seriesStart,
        Carbon $seriesEnd,
        iterable $paidByMonth,
    ): array {
        $paidByMonth = collect($paidByMonth);

        $debitByMonth = Transacao::forUser($userId)
            ->forBankUser($bankUserId)
            ->when($categoryId, fn ($q, $categoryId) => $q->where('category_id', $categoryId))
            ->where('type', TransacaoType::Debit)
            ->whereBetween('created_at', [$seriesStart, $seriesEnd])
            ->get()
            ->groupBy(fn (Transacao $transacao) => $transacao->created_at->format('Y-m'))
            ->map(fn ($items) => (float) $items->sum('amount'));

        $monthKeys = [];
        $cursor = $seriesStart->copy()->startOfMonth();
        $end = $seriesEnd->copy()->startOfMonth();
        while ($cursor->lte($end)) {
            $monthKeys[] = $cursor->format('Y-m');
            $cursor->addMonthNoOverflow();
        }

        $creditByMonth = collect($monthKeys)->mapWithKeys(fn ($k) => [$k => 0.0]);

        $creditTransactions = Transacao::with('parcelas')
            ->forUser($userId)
            ->forBankUser($bankUserId)
            ->when($categoryId, fn ($q, $categoryId) => $q->where('category_id', $categoryId))
            ->where('type', TransacaoType::Credit)
            ->get();

        foreach ($creditTransactions as $t) {
            if (! $t->is_recurring && $t->parcelas->isNotEmpty()) {
                foreach ($t->parcelas->whereIn('month_key', $monthKeys) as $parcela) {
                    $creditByMonth[$parcela->month_key] = ($creditByMonth[$parcela->month_key] ?? 0) + (float) $parcela->amount;
                }
            } else {
                $amount = (float) $t->getInstallmentAmount();
                foreach ($monthKeys as $mk) {
                    if ($this->billing->faturaAppliesToMonth($t, Carbon::parse($mk.'-01'))) {
                        $creditByMonth[$mk] = ($creditByMonth[$mk] ?? 0) + $amount;
                    }
                }
            }
        }

        return array_map(fn (string $monthKey) => [
            'month_key' => $monthKey,
            'month_label' => ucfirst(Carbon::parse($monthKey.'-01')->translatedFormat('M Y')),
            'invoice_total' => (float) ($paidByMonth->get($monthKey)->total_paid ?? 0.0),
            'credit_total' => round((float) ($creditByMonth[$monthKey] ?? 0.0), 2),
            'debit_total' => (float) $debitByMonth->get($monthKey, 0.0),
        ], $monthKeys);
    }
}

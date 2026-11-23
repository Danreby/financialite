<?php

namespace App\Queries\Dashboard;

use App\Enums\BillPaymentStatus;
use App\Models\Bill;
use App\Models\BillPayment;
use Carbon\Carbon;

/**
 * Contas a pagar previstas em cada mês de fatura (chave bills_data de cada grupo).
 *
 * Conta com valor fixo entra pelo valor; conta variável (amount nulo) entra pela
 * média dos três últimos pagamentos pagos, ou 0 sem histórico.
 */
class BillsByInvoiceMonthQuery
{
    /**
     * @param  list<array<string, mixed>>  $monthlyGroups  grupos de FaturaBillingService::groupFaturasByMonth
     * @return list<array<string, mixed>>
     */
    public function attach(int $userId, array $monthlyGroups): array
    {
        $activeBills = Bill::forUser($userId)
            ->active()
            ->orderBy('due_day')
            ->get();

        if ($activeBills->isEmpty()) {
            return array_map(function ($group) {
                $group['bills_data'] = ['total' => 0.0, 'items' => []];

                return $group;
            }, $monthlyGroups);
        }

        $variableBillData = [];
        foreach ($activeBills->filter(fn ($b) => is_null($b->amount)) as $bill) {
            $payments = BillPayment::where('bill_id', $bill->id)
                ->where('status', BillPaymentStatus::Paid)
                ->orderByDesc('due_date')
                ->take(3)
                ->get();
            $count = $payments->count();
            $variableBillData[$bill->id] = [
                'avg' => $count > 0
                    ? round((float) $payments->avg(fn ($p) => (float) $p->amount_paid), 2)
                    : 0.0,
                'count' => $count,
            ];
        }

        return array_map(function ($group) use ($activeBills, $variableBillData) {
            $monthCarbon = Carbon::parse($group['month_key'].'-01');
            $billItems = [];
            $billsTotal = 0.0;

            foreach ($activeBills as $bill) {
                if (! $bill->getDueDateForMonth($monthCarbon)) {
                    continue;
                }

                if ($bill->amount !== null) {
                    $effectiveAmount = (float) $bill->amount;
                    $isVariable = false;
                    $avgCount = null;
                } else {
                    $data = $variableBillData[$bill->id] ?? ['avg' => 0.0, 'count' => 0];
                    $effectiveAmount = $data['avg'];
                    $isVariable = true;
                    $avgCount = $data['count'];
                }

                $billItems[] = [
                    'id' => $bill->id,
                    'title' => $bill->title,
                    'amount' => $effectiveAmount,
                    'is_variable' => $isVariable,
                    'avg_count' => $avgCount,
                    'recurrence_type' => $bill->recurrence_type,
                    'color' => $bill->color,
                    'icon' => $bill->icon,
                ];
                $billsTotal += $effectiveAmount;
            }

            $group['bills_data'] = [
                'total' => round($billsTotal, 2),
                'items' => $billItems,
            ];

            return $group;
        }, $monthlyGroups);
    }
}

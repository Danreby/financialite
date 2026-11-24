<?php

namespace App\Queries\Dashboard;

use App\Enums\TransacaoType;
use App\Models\Income;
use App\Models\Transacao;
use App\Services\FaturaBillingService;
use Carbon\Carbon;

/**
 * Quanto entra e sai no mês: débitos do mês de calendário de hoje, o que falta
 * pagar da fatura corrente, a renda ativa e a sobra (renda - fatura - débitos).
 */
class MonthlyTotalsQuery
{
    public function __construct(private FaturaBillingService $billing) {}

    /**
     * @param  array<string, mixed>|null  $invoiceGroup  grupo da fatura corrente (CurrentInvoiceQuery)
     * @return array{pending_bill: float, debit_total: float, total_monthly_income: float, remaining_money: float}
     */
    public function get(int $userId, ?int $bankUserId, ?int $categoryId, ?array $invoiceGroup): array
    {
        $today = Carbon::today();

        $debitTotal = (float) Transacao::forUser($userId)
            ->forBankUser($bankUserId)
            ->when($categoryId, fn ($q, $categoryId) => $q->where('category_id', $categoryId))
            ->where('type', TransacaoType::Debit)
            ->whereBetween('created_at', [$today->copy()->startOfMonth(), $today->copy()->endOfMonth()])
            ->sum('amount');

        $pendingBill = (float) $this->billing->calculatePendingBillFromGroup($invoiceGroup);

        // Renda ativa: recorrentes e avulsas marcadas como ativas, de qualquer mês.
        $totalMonthlyIncome = (float) Income::forUser($userId)->active()->sum('amount');

        return [
            'pending_bill' => $pendingBill,
            'debit_total' => $debitTotal,
            'total_monthly_income' => $totalMonthlyIncome,
            'remaining_money' => $totalMonthlyIncome - $pendingBill - $debitTotal,
        ];
    }
}

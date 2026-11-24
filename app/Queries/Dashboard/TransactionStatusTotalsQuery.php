<?php

namespace App\Queries\Dashboard;

use App\Enums\TransacaoStatus;
use App\Enums\TransacaoType;
use App\Models\Transacao;

/**
 * Totais de todos os tempos por tipo e situação (as cinco primeiras chaves do
 * stats do Dashboard). Os nomes vêm de quando crédito era receita: total_income
 * é crédito pago e pending_income é crédito em aberto. As somas saem cruas do
 * banco (número no SQLite, string decimal no MySQL), como sempre saíram.
 */
class TransactionStatusTotalsQuery
{
    /**
     * @return array{total_income: mixed, total_expenses: mixed, pending_income: mixed, pending_expenses: mixed, overdue_count: int}
     */
    public function get(int $userId, ?int $bankUserId = null, ?int $categoryId = null): array
    {
        $base = Transacao::forUser($userId)
            ->forBankUser($bankUserId)
            ->when($categoryId, fn ($q, $categoryId) => $q->where('category_id', $categoryId));

        return [
            'total_income' => (clone $base)
                ->where('type', TransacaoType::Credit)
                ->where('status', TransacaoStatus::Paid)
                ->sum('amount'),
            'total_expenses' => (clone $base)
                ->where('type', TransacaoType::Debit)
                ->where('status', TransacaoStatus::Paid)
                ->sum('amount'),
            'pending_income' => (clone $base)
                ->where('type', TransacaoType::Credit)
                ->where('status', '!=', TransacaoStatus::Paid)
                ->sum('amount'),
            'pending_expenses' => (clone $base)
                ->where('type', TransacaoType::Debit)
                ->where('status', '!=', TransacaoStatus::Paid)
                ->sum('amount'),
            'overdue_count' => (clone $base)
                ->where('status', TransacaoStatus::Overdue)
                ->count(),
        ];
    }
}

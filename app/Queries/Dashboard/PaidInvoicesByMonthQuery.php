<?php

namespace App\Queries\Dashboard;

use App\Models\Fatura;
use Illuminate\Support\Collection;

/**
 * Quanto já foi pago de cada fatura, por mês (tabela faturas).
 *
 * Sem filtro de cartão, soma os cartões do mês num objeto {total_paid, paid_at}.
 * Com filtro, devolve os registros do cartão (ou os sem cartão, se o filtro veio
 * vazio) indexados por month_key.
 */
class PaidInvoicesByMonthQuery
{
    /**
     * Os valores são Fatura (com filtro) ou objeto {total_paid, paid_at} (sem filtro);
     * quem consome lê só ->total_paid e ->paid_at.
     *
     * @return Collection<array-key, mixed>
     */
    public function get(int $userId, ?int $bankUserId = null, bool $filterByBankUser = false): Collection
    {
        $query = Fatura::where('user_id', $userId);

        if ($filterByBankUser && $bankUserId !== null) {
            $query->where('bank_user_id', $bankUserId);
        } elseif ($filterByBankUser) {
            $query->whereNull('bank_user_id');
        }

        $results = $query->get();

        if (! $filterByBankUser) {
            return $results->groupBy('month_key')->map(function ($faturas) {
                return (object) [
                    'total_paid' => (float) $faturas->sum('total_paid'),
                    'paid_at' => $faturas->max('paid_at'),
                ];
            });
        }

        return $results->keyBy('month_key');
    }
}

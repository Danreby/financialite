<?php

namespace App\Enums;

/**
 * Situação de uma parcela (coluna transacao_parcelas.status). Note que a
 * parcela usa "pending" onde a transação usa "unpaid".
 */
enum TransacaoParcelaStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Overdue = 'overdue';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

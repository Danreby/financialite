<?php

namespace App\Enums;

/**
 * Situação da transação (coluna transacoes.status). Débito nasce "paid";
 * compra no cartão nasce "unpaid" e vira "paid" quando a fatura quita tudo.
 */
enum TransacaoStatus: string
{
    case Paid = 'paid';
    case Unpaid = 'unpaid';
    case Overdue = 'overdue';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

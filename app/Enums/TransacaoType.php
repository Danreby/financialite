<?php

namespace App\Enums;

/**
 * Tipo de transação (coluna transacoes.type): compra no cartão ou débito em conta.
 */
enum TransacaoType: string
{
    case Credit = 'credit';
    case Debit = 'debit';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

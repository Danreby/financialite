<?php

namespace App\Enums;

/**
 * Situação de uma conta a pagar (coluna bills.status).
 */
enum BillStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Completed = 'completed';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

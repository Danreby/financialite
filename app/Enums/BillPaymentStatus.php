<?php

namespace App\Enums;

/**
 * Situação de um pagamento de conta (coluna bill_payments.status).
 */
enum BillPaymentStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Overdue = 'overdue';
    case Cancelled = 'cancelled';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

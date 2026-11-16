<?php

namespace App\Exceptions;

use DomainException;

/**
 * Lançada quando uma conta bancária não tem saldo para cobrir um débito.
 * Genérica para qualquer operação que debita uma conta (fatura, contas a pagar etc.).
 */
class InsufficientBalanceException extends DomainException
{
    public function __construct(public readonly string $accountName, public readonly int $missingCents)
    {
        parent::__construct(sprintf(
            'Saldo insuficiente na conta %s: faltam R$ %s.',
            $accountName,
            number_format($missingCents / 100, 2, ',', '.')
        ));
    }
}

<?php

namespace App\Exceptions;

use DomainException;

/**
 * Lançada ao tentar excluir uma conta bancária que já tem histórico financeiro.
 */
class BankAccountHasMovementsException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Esta conta tem movimentações. Arquive em vez de excluir.');
    }
}

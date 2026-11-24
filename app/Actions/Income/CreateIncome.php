<?php

namespace App\Actions\Income;

use App\Contracts\Services\IncomeServiceInterface;
use App\Models\Income;
use App\Models\User;

/**
 * Cadastra uma receita (recorrente ou avulsa). A avulsa com bank_account_id credita a
 * conta pelo BankLedgerService, dentro da mesma transação. Usada por
 * IncomeController::store (web) e IncomeApiController::store.
 */
class CreateIncome
{
    public function __construct(private IncomeServiceInterface $incomes) {}

    /**
     * @param  array<string, mixed>  $data  saída de IncomeStoreRequest::validated(); bank_user_id e
     *                                      bank_account_id já vêm validados como do usuário
     */
    public function handle(User $user, array $data): Income
    {
        return $this->incomes->createForUser($user, $data);
    }
}

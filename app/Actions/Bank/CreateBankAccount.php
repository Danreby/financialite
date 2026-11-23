<?php

namespace App\Actions\Bank;

use App\Contracts\Services\BankAccountServiceInterface;
use App\Models\BankUser;
use App\Models\User;

/**
 * Vincula um banco ao usuário, com saldo inicial opcional lançado no extrato.
 * Usada por BankController::store (web) e BankApiController::store.
 */
class CreateBankAccount
{
    public function __construct(private BankAccountServiceInterface $accounts) {}

    /**
     * @param  array{bank_id: int|string, balance?: int|float|string|null}  $data  saída de BankStoreRequest::validated()
     *
     * @throws \DomainException o usuário já tem conta nesse banco
     */
    public function handle(User $user, array $data): BankUser
    {
        return $this->accounts->createForUser($user, $data);
    }
}

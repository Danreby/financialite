<?php

namespace App\Actions\Bank;

use App\Contracts\Services\BankTransferServiceInterface;
use App\Models\BankTransfer;
use App\Models\User;

/**
 * Transfere entre duas contas do usuário. O BankTransferService trava as duas contas
 * (em ordem de id), confere o saldo em centavos e lança saída e entrada no extrato.
 * Usada por BankController::transfer e BankApiController::transfer.
 */
class TransferBetweenAccounts
{
    public function __construct(private BankTransferServiceInterface $transfers) {}

    /**
     * @param  array<string, mixed>  $data  saída de BankTransferRequest::validated()
     *
     * @throws \DomainException mesma conta, valor inválido, conta alheia ou saldo insuficiente
     */
    public function handle(User $user, array $data): BankTransfer
    {
        return $this->transfers->transfer($user, $data);
    }
}

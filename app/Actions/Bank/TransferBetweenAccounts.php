<?php

namespace App\Actions\Bank;

use App\Contracts\Services\BankTransferServiceInterface;
use App\Models\BankTransfer;
use App\Models\BankUser;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

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
     * @throws ModelNotFoundException conta inexistente ou de outro usuário (404)
     * @throws \DomainException mesma conta, valor inválido ou saldo insuficiente
     */
    public function handle(User $user, array $data): BankTransfer
    {
        BankUser::forUser($user->id)->findOrFail((int) $data['from_bank_user_id']);
        BankUser::forUser($user->id)->findOrFail((int) $data['to_bank_user_id']);

        return $this->transfers->transfer($user, $data);
    }
}

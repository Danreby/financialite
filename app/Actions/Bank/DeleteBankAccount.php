<?php

namespace App\Actions\Bank;

use App\Contracts\Services\BankAccountServiceInterface;
use App\Exceptions\BankAccountHasMovementsException;
use App\Models\BankUser;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Remove uma conta bancária sem movimentações. Usada por BankController::destroy e
 * BankApiController::destroy.
 */
class DeleteBankAccount
{
    public function __construct(private BankAccountServiceInterface $accounts) {}

    /**
     * @throws ModelNotFoundException conta de outro usuário
     * @throws BankAccountHasMovementsException
     */
    public function handle(User $user, int $id): void
    {
        $this->accounts->deleteForUser(BankUser::forUser($user->id)->findOrFail($id));
    }
}

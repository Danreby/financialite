<?php

namespace App\Actions\Bank;

use App\Contracts\Services\BankAccountServiceInterface;
use App\Models\BankUser;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Ajusta o saldo de uma conta do usuário (lançamento manual com a diferença, em
 * centavos e com a conta travada). Usada por BankController::update e BankApiController::update.
 */
class UpdateBankBalance
{
    public function __construct(private BankAccountServiceInterface $accounts) {}

    /**
     * @throws ModelNotFoundException conta de outro usuário
     */
    public function handle(User $user, int $id, string|int|float $balance): BankUser
    {
        return $this->accounts->updateBalance(BankUser::forUser($user->id)->findOrFail($id), $balance);
    }
}

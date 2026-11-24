<?php

namespace App\Actions\SavingsGoal;

use App\Contracts\Services\SavingsGoalServiceInterface;
use App\Models\SavingsGoal;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Soma um valor à meta, limitado ao alvo (a meta fica concluída ao atingir). O
 * SavingsGoalService relê a meta com lock antes de somar, em centavos.
 * Usada por SavingsGoalController::deposit e SavingsGoalApiController::deposit.
 */
class DepositToSavingsGoal
{
    public function __construct(private SavingsGoalServiceInterface $goals) {}

    /**
     * @throws ModelNotFoundException meta de outro usuário
     */
    public function handle(User $user, int $id, string|int|float $amount): SavingsGoal
    {
        return $this->goals->deposit(SavingsGoal::forUser($user->id)->findOrFail($id), $amount);
    }
}

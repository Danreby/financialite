<?php

namespace App\Actions\SavingsGoal;

use App\Contracts\Services\SavingsGoalServiceInterface;
use App\Models\SavingsGoal;
use App\Models\User;
use App\Support\Money;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

/**
 * Retira um valor da meta. Retirar mais que o saldo é recusado; a comparação usa o
 * saldo travado (lockForUpdate), em centavos. Usada por SavingsGoalController::withdraw
 * e SavingsGoalApiController::withdraw.
 */
class WithdrawFromSavingsGoal
{
    public const EXCEEDS_BALANCE = 'Valor de retirada excede o saldo disponível.';

    public function __construct(private SavingsGoalServiceInterface $goals) {}

    /**
     * @throws ModelNotFoundException meta de outro usuário
     * @throws \DomainException valor maior que o saldo da meta
     */
    public function handle(User $user, int $id, string|int|float $amount): SavingsGoal
    {
        return DB::transaction(function () use ($user, $id, $amount) {
            $goal = SavingsGoal::forUser($user->id)->lockForUpdate()->findOrFail($id);

            if (Money::fromDecimal($amount) > Money::fromDecimal((string) ($goal->current_amount ?? '0'))) {
                throw new \DomainException(self::EXCEEDS_BALANCE);
            }

            return $this->goals->withdraw($goal, $amount);
        });
    }
}

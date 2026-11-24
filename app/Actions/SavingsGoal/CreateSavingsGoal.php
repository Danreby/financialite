<?php

namespace App\Actions\SavingsGoal;

use App\Contracts\Services\SavingsGoalServiceInterface;
use App\Models\SavingsGoal;
use App\Models\User;

/**
 * Cria uma meta de economia. Usada por SavingsGoalController::store (web) e
 * SavingsGoalApiController::store.
 */
class CreateSavingsGoal
{
    public function __construct(private SavingsGoalServiceInterface $goals) {}

    /**
     * @param  array<string, mixed>  $data  saída de SavingsGoalStoreRequest::validated()
     */
    public function handle(User $user, array $data): SavingsGoal
    {
        return $this->goals->createForUser($user, $data);
    }
}

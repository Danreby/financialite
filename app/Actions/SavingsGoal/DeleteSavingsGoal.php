<?php

namespace App\Actions\SavingsGoal;

use App\Contracts\Services\SavingsGoalServiceInterface;
use App\Models\SavingsGoal;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Remove (soft delete) uma meta. Usada por SavingsGoalController::destroy e
 * SavingsGoalApiController::destroy.
 */
class DeleteSavingsGoal
{
    public function __construct(private SavingsGoalServiceInterface $goals) {}

    /**
     * @throws ModelNotFoundException meta de outro usuário
     */
    public function handle(User $user, int $id): void
    {
        $this->goals->deleteForUser(SavingsGoal::forUser($user->id)->findOrFail($id));
    }
}

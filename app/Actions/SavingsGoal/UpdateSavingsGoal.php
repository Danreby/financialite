<?php

namespace App\Actions\SavingsGoal;

use App\Contracts\Services\SavingsGoalServiceInterface;
use App\Models\SavingsGoal;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Edita uma meta do usuário. Usada por SavingsGoalController::update e
 * SavingsGoalApiController::update.
 */
class UpdateSavingsGoal
{
    public function __construct(private SavingsGoalServiceInterface $goals) {}

    /**
     * @param  array<string, mixed>  $data  saída de SavingsGoalUpdateRequest::validated()
     *
     * @throws ModelNotFoundException meta de outro usuário
     */
    public function handle(User $user, int $id, array $data): SavingsGoal
    {
        return $this->goals->updateForUser(SavingsGoal::forUser($user->id)->findOrFail($id), $data);
    }
}

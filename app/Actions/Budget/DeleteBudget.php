<?php

namespace App\Actions\Budget;

use App\Models\Budget;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

/**
 * Apaga o orçamento e seus limites por categoria. Usada por BudgetController::destroy
 * e BudgetApiController::destroy.
 */
class DeleteBudget
{
    /**
     * @throws ModelNotFoundException orçamento de outro usuário
     */
    public function handle(User $user, int $id): void
    {
        DB::transaction(function () use ($user, $id) {
            $budget = Budget::forUser($user->id)->lockForUpdate()->findOrFail($id);
            $budget->categoryLimits()->delete();
            $budget->delete();
        });
    }
}

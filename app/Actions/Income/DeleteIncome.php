<?php

namespace App\Actions\Income;

use App\Contracts\Services\IncomeServiceInterface;
use App\Models\Income;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Remove (soft delete) uma receita. Usada por IncomeController::destroy e IncomeApiController::destroy.
 */
class DeleteIncome
{
    public function __construct(private IncomeServiceInterface $incomes) {}

    /**
     * @throws ModelNotFoundException receita de outro usuário
     */
    public function handle(User $user, int $id): void
    {
        $this->incomes->deleteForUser(Income::forUser($user->id)->findOrFail($id));
    }
}

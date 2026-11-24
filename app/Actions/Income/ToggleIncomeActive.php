<?php

namespace App\Actions\Income;

use App\Contracts\Services\IncomeServiceInterface;
use App\Models\Income;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Liga ou desliga uma receita. Usada por IncomeController::toggleActive e
 * IncomeApiController::toggleActive.
 */
class ToggleIncomeActive
{
    public function __construct(private IncomeServiceInterface $incomes) {}

    /**
     * @throws ModelNotFoundException receita de outro usuário
     */
    public function handle(User $user, int $id): Income
    {
        return $this->incomes->toggleActive(Income::forUser($user->id)->findOrFail($id));
    }
}

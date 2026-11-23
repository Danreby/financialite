<?php

namespace App\Actions\Income;

use App\Contracts\Services\IncomeServiceInterface;
use App\Models\Income;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Liga ou desliga o depósito automático de uma receita recorrente. Usada por
 * IncomeController::toggleAutoDeposit e IncomeApiController::toggleAutoDeposit.
 */
class ToggleIncomeAutoDeposit
{
    public function __construct(private IncomeServiceInterface $incomes) {}

    /**
     * @throws ModelNotFoundException receita de outro usuário
     */
    public function handle(User $user, int $id): Income
    {
        return $this->incomes->toggleAutoDeposit(Income::forUser($user->id)->findOrFail($id));
    }
}

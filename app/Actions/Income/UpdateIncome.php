<?php

namespace App\Actions\Income;

use App\Contracts\Services\IncomeServiceInterface;
use App\Models\Income;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Edita uma receita do usuário. Usada por IncomeController::update e IncomeApiController::update.
 */
class UpdateIncome
{
    public function __construct(private IncomeServiceInterface $incomes) {}

    /**
     * @param  array<string, mixed>  $data  saída de IncomeUpdateRequest::validated()
     *
     * @throws ModelNotFoundException receita de outro usuário
     */
    public function handle(User $user, int $id, array $data): Income
    {
        return $this->incomes->updateForUser(Income::forUser($user->id)->findOrFail($id), $data);
    }
}

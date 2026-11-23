<?php

namespace App\Actions\Budget;

use App\Models\Budget;
use App\Models\User;
use App\Support\Money;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

/**
 * Edita limite mensal, status e (se enviados) os limites por categoria, que são
 * substituídos por inteiro. Usada por BudgetController::update e BudgetApiController::update.
 */
class UpdateBudget
{
    public function __construct(private SyncBudgetCategoryLimits $syncLimits) {}

    /**
     * @param  array<string, mixed>  $data  saída de BudgetUpdateRequest::validated()
     *
     * @throws ModelNotFoundException orçamento de outro usuário
     */
    public function handle(User $user, int $id, array $data): Budget
    {
        return DB::transaction(function () use ($user, $id, $data) {
            $budget = Budget::forUser($user->id)->lockForUpdate()->findOrFail($id);

            $budget->update([
                'monthly_limit' => isset($data['monthly_limit'])
                    ? Money::toDecimal(Money::fromDecimal($data['monthly_limit']))
                    : $budget->monthly_limit,
                'is_active' => $data['is_active'] ?? $budget->is_active,
            ]);

            if (isset($data['category_limits'])) {
                $budget->categoryLimits()->delete();
                $this->syncLimits->handle($budget, $data['category_limits']);
            }

            return $budget;
        });
    }
}

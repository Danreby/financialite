<?php

namespace App\Actions\Budget;

use App\Models\Budget;
use App\Models\User;
use App\Support\Money;
use Illuminate\Support\Facades\DB;

/**
 * Cria o orçamento de um mês com os limites por categoria. Usada por
 * BudgetController::store (web) e BudgetApiController::store.
 */
class CreateBudget
{
    public function __construct(private SyncBudgetCategoryLimits $syncLimits) {}

    /**
     * @param  array<string, mixed>  $data  saída de BudgetStoreRequest::validated()
     *
     * @throws \DomainException já existe orçamento para o mês
     */
    public function handle(User $user, array $data): Budget
    {
        return DB::transaction(function () use ($user, $data) {
            $exists = Budget::forUser($user->id)
                ->forMonth($data['month_year'])
                ->lockForUpdate()
                ->exists();

            if ($exists) {
                throw new \DomainException('Já existe um orçamento para este mês.');
            }

            $budget = Budget::create([
                'monthly_limit' => Money::toDecimal(Money::fromDecimal($data['monthly_limit'])),
                'month_year' => $data['month_year'],
                'is_active' => $data['is_active'] ?? true,
                'user_id' => $user->id,
            ]);

            $this->syncLimits->handle($budget, $data['category_limits'] ?? []);

            return $budget;
        });
    }
}

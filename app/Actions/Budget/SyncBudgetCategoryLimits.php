<?php

namespace App\Actions\Budget;

use App\Models\Budget;
use App\Models\BudgetCategory;
use App\Support\Money;

/**
 * Grava os limites por categoria de um orçamento. Quem chama roda dentro da
 * transação e apaga os limites antigos quando for substituir.
 */
class SyncBudgetCategoryLimits
{
    /**
     * @param  array<int, array{category_id: int|string, limit: int|float|string}>  $limits
     */
    public function handle(Budget $budget, array $limits): void
    {
        foreach ($limits as $limit) {
            BudgetCategory::create([
                'budget_id' => $budget->id,
                'category_id' => $limit['category_id'],
                'limit' => Money::toDecimal(Money::fromDecimal($limit['limit'])),
            ]);
        }
    }
}

<?php

namespace App\Queries;

use App\Actions\Budget\GetOrCreateCurrentBudget;
use App\Models\Budget;
use App\Models\Income;
use App\Models\User;

/**
 * Orçamento do mês com gasto, saldo e percentual (total e por categoria), no formato
 * da web (GET /budgets/current e /budgets/get-or-create-current).
 */
class BudgetSummaryQuery
{
    /**
     * Orçamento do mês corrente com a renda ativa e o limite recomendado (80% dela).
     * Sem orçamento, devolve só a renda e o limite recomendado.
     *
     * @return array<string, mixed>
     */
    public function current(User $user): array
    {
        $monthlyIncome = (float) Income::forUser($user->id)
            ->where('is_active', true)
            ->sum('amount');

        $recommendedCents = GetOrCreateCurrentBudget::recommendedLimitCents($user);
        $recommendedLimit = $recommendedCents === null ? null : $recommendedCents / 100.0;

        $budget = Budget::forUser($user->id)
            ->forMonth(now()->format('Y-m'))
            ->first();

        if (! $budget) {
            return [
                'monthly_income' => $monthlyIncome,
                'recommended_limit' => $recommendedLimit,
            ];
        }

        return $this->summarize($budget) + [
            'monthly_income' => $monthlyIncome,
            'recommended_limit' => $recommendedLimit,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function summarize(Budget $budget): array
    {
        $budget->load(['categoryLimits.category:id,name,color,icon']);

        $totalSpent = $budget->getCurrentSpending();
        $categorySpending = $budget->getCategorySpending();

        $budgetData = $budget->toArray();
        $budgetData['total_spent'] = $totalSpent;
        $budgetData['remaining'] = max(0, $budget->monthly_limit - $totalSpent);
        $budgetData['percentage'] = $budget->monthly_limit > 0
            ? min(100, ($totalSpent / $budget->monthly_limit) * 100)
            : 0;

        foreach ($budgetData['category_limits'] as &$categoryLimit) {
            $spent = $categorySpending[$categoryLimit['category_id']]['total'] ?? 0;

            $categoryLimit['spent'] = $spent;
            $categoryLimit['remaining'] = max(0, $categoryLimit['limit'] - $spent);
            $categoryLimit['percentage'] = $categoryLimit['limit'] > 0
                ? min(100, ($spent / $categoryLimit['limit']) * 100)
                : 0;
        }
        unset($categoryLimit);

        return $budgetData;
    }
}

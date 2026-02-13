<?php

namespace App\Services;

use App\Models\Transacao;
use App\Models\Income;
use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;

class DashboardInsightsService
{
    public function getInsights(Authenticatable $user, ?int $bankUserId = null): array
    {
        return [
            'financial_health' => $this->calculateFinancialHealth($user, $bankUserId),
            'budget_progress' => $this->getBudgetProgress($user, $bankUserId),
            'upcoming_bills' => $this->getUpcomingBills($user, $bankUserId),
            'spending_trends' => $this->getSpendingTrends($user, $bankUserId),
        ];
    }

    private function calculateFinancialHealth(Authenticatable $user, ?int $bankUserId): array
    {
        $today = Carbon::today();
        $monthStart = $today->copy()->startOfMonth();
        $monthEnd = $today->copy()->endOfMonth();

        $monthlyIncome = Income::forUser($user->id)
            ->where('is_active', true)
            ->sum('amount');

        if ($monthlyIncome == 0) {
            $monthlyIncome = 5000; 
        }

        $currentMonthSpending = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->where('type', 'debit')
            ->sum('amount');

        $savingsRate = $monthlyIncome > 0 
            ? max(0, (($monthlyIncome - $currentMonthSpending) / $monthlyIncome) * 100) 
            : 0;

        $budgetAdherence = $this->calculateBudgetAdherence($user, $bankUserId);

        $totalBalance = Income::forUser($user->id)->sum('amount') - 
                       Transacao::forUser($user->id)->where('type', 'debit')->sum('amount');
        
        $emergencyFund = $currentMonthSpending > 0 
            ? max(0, $totalBalance / $currentMonthSpending) 
            : 0;

        $totalTransactions = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->where('type', 'debit')
            ->count();

        $recurringTransactions = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->where('type', 'debit')
            ->where('is_recurring', true)
            ->count();

        $recurringControl = $totalTransactions > 0 
            ? ($recurringTransactions / $totalTransactions) * 100 
            : 0;

        $score = (
            ($savingsRate * 0.3) + 
            ($budgetAdherence * 0.3) + 
            (min(100, ($emergencyFund / 6) * 100) * 0.25) + 
            ($recurringControl * 0.15)
        );

        return [
            'score' => round($score, 1),
            'factors' => [
                'savingsRate' => round($savingsRate, 1),
                'budgetAdherence' => round($budgetAdherence, 1),
                'debtRatio' => 0,
                'emergencyFund' => round($emergencyFund, 1),
                'recurringControl' => round($recurringControl, 1),
            ],
        ];
    }

    private function calculateBudgetAdherence(Authenticatable $user, ?int $bankUserId): float
    {
        return 75.0;
    }

    private function getBudgetProgress(Authenticatable $user, ?int $bankUserId): array
    {
        $today = Carbon::today();
        $monthStart = $today->copy()->startOfMonth();
        $monthEnd = $today->copy()->endOfMonth();

        $monthlyIncome = Income::forUser($user->id)
            ->where('is_active', true)
            ->sum('amount');

        $totalBudget = $monthlyIncome > 0 ? $monthlyIncome * 0.8 : 5000;

        $totalSpent = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->where('type', 'debit')
            ->sum('amount');

        $categorySpending = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->where('type', 'debit')
            ->whereNotNull('category_id')
            ->selectRaw('category_id, SUM(amount) as spent')
            ->groupBy('category_id')
            ->get();

        $categories = Category::forUser($user->id)->get()->keyBy('id');

        $budgets = $categorySpending->map(function ($item) use ($categories, $totalBudget) {
            $category = $categories->get($item->category_id);
            $categoryBudget = $totalBudget * 0.15;

            return [
                'categoryName' => $category?->name ?? 'Sem categoria',
                'limit' => round($categoryBudget, 2),
                'spent' => round($item->spent, 2),
            ];
        })->values()->all();

        return [
            'total_budget' => round($totalBudget, 2),
            'total_spent' => round($totalSpent, 2),
            'budgets' => $budgets,
        ];
    }

    private function getUpcomingBills(Authenticatable $user, ?int $bankUserId): array
    {
        $today = Carbon::today();
        $next30Days = $today->copy()->addDays(30);

        $lastMonthStart = $today->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $today->copy()->subMonth()->endOfMonth();

        $recurringTransactions = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->where('type', 'debit')
            ->where('is_recurring', true)
            ->with('category')
            ->get();

        $bills = $recurringTransactions->map(function ($transaction) use ($today) {
            $dayOfMonth = Carbon::parse($transaction->created_at)->day;
            $upcomingDate = $today->copy()->day(min($dayOfMonth, $today->daysInMonth));
            
            if ($upcomingDate->lt($today)) {
                $upcomingDate->addMonth()->day(min($dayOfMonth, $upcomingDate->daysInMonth));
            }

            $alreadyPaid = Transacao::forUser($transaction->user_id)
                ->where('title', $transaction->title)
                ->whereBetween('created_at', [$today->copy()->startOfMonth(), $today->copy()->endOfMonth()])
                ->exists();

            return [
                'date' => $upcomingDate->format('Y-m-d'),
                'amount' => (float) $transaction->amount,
                'description' => $transaction->title,
                'category' => $transaction->category?->name,
                'status' => $alreadyPaid ? 'paid' : 'pending',
                'recurring' => true,
            ];
        })->sortBy('date')->values()->take(10)->all();

        return $bills;
    }

    private function getSpendingTrends(Authenticatable $user, ?int $bankUserId): array
    {
        $today = Carbon::today();

        $currentMonthStart = $today->copy()->startOfMonth();
        $currentMonthEnd = $today->copy()->endOfMonth();

        $previousMonthStart = $today->copy()->subMonth()->startOfMonth();
        $previousMonthEnd = $today->copy()->subMonth()->endOfMonth();

        $threeMonthsAgo = $today->copy()->subMonths(3)->startOfMonth();

        $currentMonth = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$currentMonthStart, $currentMonthEnd])
            ->where('type', 'debit')
            ->sum('amount');

        $previousMonth = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$previousMonthStart, $previousMonthEnd])
            ->where('type', 'debit')
            ->sum('amount');

        $threeMonthTotal = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$threeMonthsAgo, $currentMonthEnd])
            ->where('type', 'debit')
            ->sum('amount');

        $threeMonthAvg = $threeMonthTotal / 3;

        $currentCategorySpending = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$currentMonthStart, $currentMonthEnd])
            ->where('type', 'debit')
            ->whereNotNull('category_id')
            ->selectRaw('category_id, SUM(amount) as current')
            ->groupBy('category_id')
            ->get()
            ->keyBy('category_id');

        $previousCategorySpending = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$previousMonthStart, $previousMonthEnd])
            ->where('type', 'debit')
            ->whereNotNull('category_id')
            ->selectRaw('category_id, SUM(amount) as previous')
            ->groupBy('category_id')
            ->get()
            ->keyBy('category_id');

        $categories = Category::forUser($user->id)->get()->keyBy('id');

        $allCategoryIds = collect($currentCategorySpending->keys())
            ->merge($previousCategorySpending->keys())
            ->unique();

        $categoryTrends = $allCategoryIds->map(function ($categoryId) use ($currentCategorySpending, $previousCategorySpending, $categories) {
            $current = $currentCategorySpending->get($categoryId)?->current ?? 0;
            $previous = $previousCategorySpending->get($categoryId)?->previous ?? 0;
            $category = $categories->get($categoryId);

            return [
                'categoryName' => $category?->name ?? 'Sem categoria',
                'current' => (float) $current,
                'previous' => (float) $previous,
            ];
        })->values()->take(10)->all();

        return [
            'current_month' => (float) $currentMonth,
            'previous_month' => (float) $previousMonth,
            'three_month_avg' => (float) $threeMonthAvg,
            'category_trends' => $categoryTrends,
        ];
    }
}

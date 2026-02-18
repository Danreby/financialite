<?php

namespace App\Services;

use App\Models\Transacao;
use App\Models\Fatura;
use App\Models\Income;
use App\Models\Category;
use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Budget;
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
        $currentMonthKey = $today->format('Y-m');

        $monthlyIncome = Income::forUser($user->id)
            ->where('is_active', true)
            ->sum('amount');

        if ($monthlyIncome == 0) {
            $monthlyIncome = 5000;
        }

        $debitSpending = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->where('type', 'debit')
            ->sum('amount');

        $currentInvoicePending = Fatura::where('user_id', $user->id)
            ->where('month_key', $currentMonthKey)
            ->when($bankUserId, fn($q) => $q->where('bank_user_id', $bankUserId))
            ->whereNull('paid_at')
            ->sum('total_paid');

        $currentMonthSpending = $debitSpending + $currentInvoicePending;

        $savingsRate = $monthlyIncome > 0 
            ? max(0, (($monthlyIncome - $currentMonthSpending) / $monthlyIncome) * 100) 
            : 0;

        $budgetAdherence = $this->calculateBudgetAdherence($user, $bankUserId);

        $totalIncome = Income::forUser($user->id)->sum('amount');
        $totalSpending = Transacao::forUser($user->id)->where('type', 'debit')->sum('amount');
        $totalBalance = $totalIncome - $totalSpending;
        
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

        $activeBillsCount = Bill::forUser($user->id)
            ->active()
            ->recurrent()
            ->count();

        $recurringControl = $totalTransactions > 0 
            ? min(100, (($recurringTransactions + $activeBillsCount) / $totalTransactions) * 100) 
            : ($activeBillsCount > 0 ? 80 : 0);

        $upcomingBillsCount = Bill::forUser($user->id)->active()->count();
        $overdueBillsCount = BillPayment::whereHas('bill', function($q) use ($user) {
            $q->where('user_id', $user->id);
        })->where('status', 'overdue')->count();

        $paymentDiscipline = $upcomingBillsCount > 0
            ? max(0, 100 - (($overdueBillsCount / ($upcomingBillsCount + $overdueBillsCount)) * 100))
            : 100;

        $score = (
            ($savingsRate * 0.25) +
            ($budgetAdherence * 0.25) +
            (min(100, ($emergencyFund / 6) * 100) * 0.20) +
            ($recurringControl * 0.15) +
            ($paymentDiscipline * 0.15)
        );

        return [
            'score' => round($score, 1),
            'factors' => [
                'savingsRate' => round($savingsRate, 1),
                'budgetAdherence' => round($budgetAdherence, 1),
                'debtRatio' => 0,
                'emergencyFund' => round($emergencyFund, 1),
                'recurringControl' => round($recurringControl, 1),
                'paymentDiscipline' => round($paymentDiscipline, 1),
            ],
        ];
    }

    private function calculateBudgetAdherence(Authenticatable $user, ?int $bankUserId): float
    {
        $currentMonth = Carbon::now()->format('Y-m');
        
        $budget = Budget::forUser($user->id)
            ->forMonth($currentMonth)
            ->with('categoryLimits')
            ->first();

        if (!$budget || $budget->categoryLimits->isEmpty()) {
            return 50.0;
        }

        $categorySpending = $budget->getCategorySpending();
        $withinBudgetCount = 0;
        $totalCategories = $budget->categoryLimits->count();

        foreach ($budget->categoryLimits as $categoryLimit) {
            $spent = $categorySpending[$categoryLimit->category_id]['total'] ?? 0;
            if ($spent <= $categoryLimit->limit) {
                $withinBudgetCount++;
            }
        }

        return $totalCategories > 0 
            ? ($withinBudgetCount / $totalCategories) * 100 
            : 50.0;
    }

    private function getBudgetProgress(Authenticatable $user, ?int $bankUserId): array
    {
        $today = Carbon::today();
        $monthStart = $today->copy()->startOfMonth();
        $monthEnd = $today->copy()->endOfMonth();
        $currentMonth = $today->format('Y-m');

        $budget = Budget::forUser($user->id)
            ->forMonth($currentMonth)
            ->with('categoryLimits.category')
            ->first();

        if (!$budget) {
            $monthlyIncome = Income::forUser($user->id)
                ->where('is_active', true)
                ->sum('amount');

            $totalBudget = $monthlyIncome > 0 ? $monthlyIncome * 0.8 : 5000;
        } else {
            $totalBudget = $budget->monthly_limit;
        }

        $debitSpent = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->where('type', 'debit')
            ->sum('amount');

        $currentInvoicePending = Fatura::where('user_id', $user->id)
            ->where('month_key', $currentMonth)
            ->when($bankUserId, fn($q) => $q->where('bank_user_id', $bankUserId))
            ->whereNull('paid_at')
            ->sum('total_paid');

        $totalSpent = $debitSpent + $currentInvoicePending;

        $categorySpending = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->where('type', 'debit')
            ->whereNotNull('category_id')
            ->selectRaw('category_id, SUM(amount) as spent')
            ->groupBy('category_id')
            ->get()
            ->keyBy('category_id');

        $budgets = [];
        
        if ($budget && $budget->categoryLimits->isNotEmpty()) {
            $budgets = $budget->categoryLimits->map(function ($categoryLimit) use ($categorySpending) {
                $spent = $categorySpending->get($categoryLimit->category_id)?->spent ?? 0;

                return [
                    'categoryName' => $categoryLimit->category?->name ?? 'Sem categoria',
                    'limit' => round($categoryLimit->limit, 2),
                    'spent' => round($spent, 2),
                ];
            })->values()->all();
        } else {
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
        }

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

        $activeBills = Bill::forUser($user->id)
            ->active()
            ->with('category')
            ->get();

        $upcomingBills = [];

        foreach ($activeBills as $bill) {
            $nextDueDate = $bill->getNextDueDate();
            
            if ($nextDueDate && $nextDueDate->lte($next30Days)) {
                $payment = BillPayment::where('bill_id', $bill->id)
                    ->whereDate('due_date', $nextDueDate->format('Y-m-d'))
                    ->first();

                $status = $payment ? $payment->status : 'pending';
                
                if (!$payment && $nextDueDate->lt($today)) {
                    $status = 'overdue';
                }

                $upcomingBills[] = [
                    'id' => $bill->id,
                    'date' => $nextDueDate->format('Y-m-d'),
                    'amount' => (float) $bill->amount,
                    'description' => $bill->title,
                    'category' => $bill->category?->name,
                    'status' => $status === 'paid' ? 'paid' : 'pending',
                    'recurring' => $bill->recurrence_type !== 'none',
                    'color' => $bill->color,
                    'icon' => $bill->icon,
                ];
            }
        }

        $lastMonthStart = $today->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $today->copy()->subMonth()->endOfMonth();

        $recurringTransactions = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->where('type', 'debit')
            ->where('is_recurring', true)
            ->with('category')
            ->get();

        foreach ($recurringTransactions as $transaction) {
            $existingBill = collect($upcomingBills)->first(function($bill) use ($transaction) {
                return strtolower($bill['description']) === strtolower($transaction->title);
            });

            if ($existingBill) {
                continue;
            }

            $dayOfMonth = Carbon::parse($transaction->created_at)->day;
            $upcomingDate = $today->copy()->day(min($dayOfMonth, $today->daysInMonth));
            
            if ($upcomingDate->lt($today)) {
                $upcomingDate->addMonth()->day(min($dayOfMonth, $upcomingDate->daysInMonth));
            }

            $alreadyPaid = Transacao::forUser($transaction->user_id)
                ->where('title', $transaction->title)
                ->whereBetween('created_at', [$today->copy()->startOfMonth(), $today->copy()->endOfMonth()])
                ->exists();

            if ($upcomingDate->lte($next30Days)) {
                $upcomingBills[] = [
                    'date' => $upcomingDate->format('Y-m-d'),
                    'amount' => (float) $transaction->amount,
                    'description' => $transaction->title,
                    'category' => $transaction->category?->name,
                    'status' => $alreadyPaid ? 'paid' : 'pending',
                    'recurring' => true,
                    'color' => $transaction->category?->color ?? '#3b82f6',
                    'icon' => $transaction->category?->icon ?? 'FileText',
                ];
            }
        }

        usort($upcomingBills, fn($a, $b) => strcmp($a['date'], $b['date']));
        
        return array_slice($upcomingBills, 0, 10);
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

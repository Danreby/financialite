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
    public function __construct(
        private BudgetCalculationService $budgetCalculationService
    ) {}

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

        $currentMonthSpending = $this->budgetCalculationService->calculateTotalMonthlySpending(
            $user,
            $bankUserId,
            $monthStart,
            $monthEnd,
            $currentMonthKey
        );

        $savingsRate = $monthlyIncome > 0 
            ? max(0, (($monthlyIncome - $currentMonthSpending) / $monthlyIncome) * 100) 
            : 0;

        $budgetAdherence = $this->calculateBudgetAdherence($user, $bankUserId);

        $totalIncome = Income::forUser($user->id)->sum('amount');
        
        $totalDebitSpending = Transacao::forUser($user->id)->where('type', 'debit')->sum('amount');
        
        $unpaidInvoiceTotal = $this->budgetCalculationService->calculatePendingInvoiceTotal(
            $user,
            $bankUserId,
            $currentMonthKey
        );
        
        $totalSpending = $totalDebitSpending + $unpaidInvoiceTotal;
        
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
        $today = Carbon::today();
        $monthStart = $today->copy()->startOfMonth();
        $monthEnd = $today->copy()->endOfMonth();
        $currentMonth = Carbon::now()->format('Y-m');
        
        $budget = Budget::forUser($user->id)
            ->forMonth($currentMonth)
            ->with('categoryLimits')
            ->first();

        if (!$budget || $budget->categoryLimits->isEmpty()) {
            return 50.0;
        }

        $categorySpending = $this->budgetCalculationService->calculateCategorySpendingWithInvoice(
            $user,
            $bankUserId,
            $monthStart,
            $monthEnd,
            $currentMonth
        );

        $withinBudgetCount = 0;
        $totalCategories = $budget->categoryLimits->count();

        foreach ($budget->categoryLimits as $categoryLimit) {
            $spent = $categorySpending->get($categoryLimit->category_id)['spent'] ?? 0;
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

        $totalSpent = $this->budgetCalculationService->calculateTotalMonthlySpending(
            $user,
            $bankUserId,
            $monthStart,
            $monthEnd,
            $currentMonth
        );

        $categorySpending = $this->budgetCalculationService->calculateCategorySpendingWithInvoice(
            $user,
            $bankUserId,
            $monthStart,
            $monthEnd,
            $currentMonth
        );

        $budgets = [];
        
        if ($budget && $budget->categoryLimits->isNotEmpty()) {
            $categories = Category::forUser($user->id)->get()->keyBy('id');
            
            $budgets = $this->budgetCalculationService->formatCategoryBudgets(
                $categorySpending,
                $budget->categoryLimits,
                $categories
            );
        } else {
            $categories = Category::forUser($user->id)->get()->keyBy('id');
            
            $budgets = $categorySpending->map(function ($item) use ($categories, $totalBudget) {
                $category = $categories->get($item['category_id']);
                $categoryBudget = $totalBudget * 0.15;

                return [
                    'categoryName' => $category?->name ?? 'Sem categoria',
                    'limit' => round($categoryBudget, 2),
                    'spent' => round($item['spent'], 2),
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
        $currentMonth = Carbon::now();
        $nextMonth = $currentMonth->copy()->addMonth();
        $monthAfterNext = $currentMonth->copy()->addMonths(2);

        $activeBills = Bill::forUser($user->id)
            ->active()
            ->with('category')
            ->get();

        $upcomingBills = [];
        $processedBillIds = []; // Track which bills we've already added

        foreach ($activeBills as $bill) {
            // Skip if we already found an unpaid occurrence for this bill
            if (isset($processedBillIds[$bill->id])) {
                continue;
            }

            // Check current month
            $currentMonthDue = $bill->getDueDateForMonth($currentMonth);
            if ($currentMonthDue) {
                $payment = BillPayment::where('bill_id', $bill->id)
                    ->whereDate('due_date', $currentMonthDue->format('Y-m-d'))
                    ->first();

                $isPaid = $payment && $payment->status === 'paid';
                $isOverdue = !$isPaid && $currentMonthDue->lt($today);

                // If not paid, add this occurrence and mark as processed
                if (!$isPaid) {
                    $upcomingBills[] = $this->formatBillEntry(
                        $bill,
                        $currentMonthDue,
                        $isOverdue ? 'overdue' : 'pending',
                        $isOverdue,
                        true,
                        null
                    );
                    $processedBillIds[$bill->id] = true;
                    continue;
                }
            }

            // If current month is paid or doesn't exist, check next month for recurring bills
            if ($bill->recurrence_type !== 'none') {
                $nextMonthDue = $bill->getDueDateForMonth($nextMonth);
                if ($nextMonthDue) {
                    $nextPayment = BillPayment::where('bill_id', $bill->id)
                        ->whereDate('due_date', $nextMonthDue->format('Y-m-d'))
                        ->first();
                    $nextIsPaid = $nextPayment && $nextPayment->status === 'paid';

                    if (!$nextIsPaid) {
                        $upcomingBills[] = $this->formatBillEntry(
                            $bill,
                            $nextMonthDue,
                            'pending',
                            false,
                            true
                        );
                        $processedBillIds[$bill->id] = true;
                        continue;
                    }
                }

                // If next month is also paid, check month after next
                $monthAfterNextDue = $bill->getDueDateForMonth($monthAfterNext);
                if ($monthAfterNextDue) {
                    $monthAfterNextPayment = BillPayment::where('bill_id', $bill->id)
                        ->whereDate('due_date', $monthAfterNextDue->format('Y-m-d'))
                        ->first();
                    $monthAfterNextIsPaid = $monthAfterNextPayment && $monthAfterNextPayment->status === 'paid';

                    if (!$monthAfterNextIsPaid) {
                        $upcomingBills[] = $this->formatBillEntry(
                            $bill,
                            $monthAfterNextDue,
                            'pending',
                            false,
                            true
                        );
                        $processedBillIds[$bill->id] = true;
                    }
                }
            }
        }

        // Sort: overdue first, then by date (earliest first)
        usort($upcomingBills, function ($a, $b) {
            if ($a['is_overdue'] && !$b['is_overdue']) return -1;
            if (!$a['is_overdue'] && $b['is_overdue']) return 1;
            return strcmp($a['date'], $b['date']);
        });

        return array_slice($upcomingBills, 0, 15);
    }

    private function formatBillEntry(
        Bill $bill,
        Carbon $dueDate,
        string $status,
        bool $isOverdue,
        bool $canPay,
        ?float $paidAmount = null
    ): array {
        return [
            'id' => $bill->id,
            'title' => $bill->title,
            'description' => $bill->description,
            'amount' => $paidAmount ?? (float) ($bill->amount ?? 0),
            'due_day' => $bill->due_day,
            'due_date' => $dueDate->format('Y-m-d'),
            'date' => $dueDate->format('Y-m-d'),
            'recurrence_type' => $bill->recurrence_type,
            'color' => $bill->color,
            'icon' => $bill->icon,
            'status' => $status,
            'bill_status' => $bill->status,
            'category_id' => $bill->category_id,
            'category_name' => $bill->category?->name,
            'category' => $bill->category?->name,
            'can_pay' => $canPay,
            'is_overdue' => $isOverdue,
            'recurring' => $bill->recurrence_type !== 'none',
            'start_date' => $bill->start_date?->format('Y-m-d'),
        ];
    }

    private function getSpendingTrends(Authenticatable $user, ?int $bankUserId): array
    {
        $today = Carbon::today();

        $currentMonthStart = $today->copy()->startOfMonth();
        $currentMonthEnd = $today->copy()->endOfMonth();

        $previousMonthStart = $today->copy()->subMonth()->startOfMonth();
        $previousMonthEnd = $today->copy()->subMonth()->endOfMonth();

        $threeMonthsAgoStart = $today->copy()->subMonths(3)->startOfMonth();

        $currentMonth = $this->budgetCalculationService->calculateInstallmentAwareSpending(
            $user,
            $bankUserId,
            $currentMonthStart,
            $currentMonthEnd
        );

        $previousMonth = $this->budgetCalculationService->calculateInstallmentAwareSpending(
            $user,
            $bankUserId,
            $previousMonthStart,
            $previousMonthEnd
        );

        $threeMonthTotal = $this->budgetCalculationService->calculateInstallmentAwareSpending(
            $user,
            $bankUserId,
            $threeMonthsAgoStart,
            $currentMonthEnd
        );

        $threeMonthAvg = $threeMonthTotal / 3;

        $currentCategorySpending = $this->budgetCalculationService->calculateInstallmentAwareCategorySpending(
            $user,
            $bankUserId,
            $currentMonthStart,
            $currentMonthEnd
        );

        $previousCategorySpending = $this->budgetCalculationService->calculateInstallmentAwareCategorySpending(
            $user,
            $bankUserId,
            $previousMonthStart,
            $previousMonthEnd
        );

        $categories = Category::forUser($user->id)->get()->keyBy('id');

        $allCategoryIds = $currentCategorySpending->keys()
            ->merge($previousCategorySpending->keys())
            ->unique();

        $categoryTrends = $allCategoryIds->map(function ($categoryId) use ($currentCategorySpending, $previousCategorySpending, $categories) {
            $current = $currentCategorySpending->get($categoryId)['spent'] ?? 0;
            $previous = $previousCategorySpending->get($categoryId)['spent'] ?? 0;
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

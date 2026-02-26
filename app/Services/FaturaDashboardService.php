<?php

namespace App\Services;

use App\Models\CardUser;
use App\Models\Category;
use App\Models\Fatura;
use App\Models\Income;
use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;

class FaturaDashboardService
{
    public function __construct(private FaturaBillingService $billing)
    {
    }

    public function buildDashboardData(Authenticatable $user, array $filters): array
    {
        $bankUserId = $filters['bank_user_id'] ?? null;
        $categoryId = $filters['category_id'] ?? null;

        $selectedBankUser = null;

        if ($bankUserId) {
            $selectedBankUser = CardUser::forUser($user->id)->findOrFail($bankUserId);
        }

        $baseQuery = Transacao::with(['bankUser.card', 'user', 'category'])
            ->withCount('anexos')
            ->forUser($user->id)
            ->filter($filters)
            ->orderBy('created_at', 'desc');

        $allFaturas = (clone $baseQuery)
            ->where('type', 'credit')
            ->get();

        $paidByMonth = $this->paidByMonthForUser(
            $user->id,
            $bankUserId,
            array_key_exists('bank_user_id', $filters)
        );

        $monthlyGroups = $this->billing->groupFaturasByMonth($allFaturas, $paidByMonth);

        $currentMonthKey = $this->billing->resolveCurrentBillingMonthKey($selectedBankUser);

        $effective = $this->billing->resolveEffectiveGroup($monthlyGroups, $currentMonthKey);
        $effectiveMonthKey = $effective['month_key'];

        $bankAccounts = CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(function ($cardUser) {
                return [
                    'id' => $cardUser->id,
                    'name' => $cardUser->card?->name ?? ('Cartão #' . $cardUser->id),
                    'due_day' => $cardUser->due_day,
                ];
            });

        $categories = Category::forUser($user->id)
            ->ordered()
            ->get(['id', 'name', 'icon', 'color']);

        return [
            'base_query' => $baseQuery,
            'monthly_groups' => $monthlyGroups,
            'bank_accounts' => $bankAccounts,
            'current_month_key' => $effectiveMonthKey,
            'categories' => $categories,
        ];
    }

    public function buildStats(Authenticatable $user, ?int $bankUserId, ?int $categoryId, bool $filterBankUser): array
    {
        $selectedBankUser = null;

        if ($bankUserId) {
            $selectedBankUser = CardUser::forUser($user->id)->findOrFail($bankUserId);
        }

        $base = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->when($categoryId, function ($q, $categoryId) {
                $q->where('category_id', $categoryId);
            });

        $stats = $this->calculateBaseStats($base);

        $today = Carbon::today();
        $monthStart = $today->copy()->startOfMonth();
        $monthEnd = $today->copy()->endOfMonth();
        $seriesStart = $today->copy()->subMonths(5)->startOfMonth();

        $paidByMonth = $this->paidByMonthForUser(
            $user->id,
            $bankUserId,
            $filterBankUser
        );

        $monthlySummary = $this->buildDashboardMonthlySummary(
            $user,
            $bankUserId,
            $categoryId,
            $seriesStart,
            $monthEnd,
            $paidByMonth
        );

        $currentMonthDebitTotal = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->when($categoryId, function ($q, $categoryId) {
                $q->where('category_id', $categoryId);
            })
            ->where('type', 'debit')
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->sum('amount');

        $allFaturas = Transacao::with('bankUser')
            ->forUser($user->id)
            ->forBankUser($bankUserId)
            ->when($categoryId, function ($q, $categoryId) {
                $q->where('category_id', $categoryId);
            })
            ->where('type', 'credit')
            ->notStatus('paid')
            ->orderBy('created_at', 'desc')
            ->get();

        $monthlyGroups = $this->billing->groupFaturasByMonth($allFaturas, $paidByMonth);

        $currentMonthKey = $this->billing->resolveCurrentBillingMonthKey($selectedBankUser);

        $effective = $this->billing->resolveEffectiveGroup($monthlyGroups, $currentMonthKey);
        $effectiveGroup = $effective['group'];
        $effectiveMonthKey = $effective['month_key'];

        $targetMonth = null;

        try {
            $targetMonth = Carbon::createFromFormat('Y-m', $effectiveMonthKey)->startOfMonth();
        } catch (\Throwable $e) {
            $targetMonth = Carbon::today()->startOfMonth();
        }

        $targetMonthEnd = $targetMonth->copy()->endOfMonth();

        $debitEntriesForMonth = (clone $base)
            ->with('category')
            ->where('type', 'debit')
            ->where('status', 'paid')
            ->whereBetween('created_at', [$targetMonth, $targetMonthEnd])
            ->get();

        $creditEntriesForMonth = (clone $base)
            ->with(['category', 'bankUser'])
            ->where('type', 'credit')
            ->get()
            ->filter(function (Transacao $transacao) use ($targetMonth) {
                return $this->billing->faturaAppliesToMonth($transacao, $targetMonth);
            });

        $debitRows = $debitEntriesForMonth->map(function (Transacao $transacao) {
            return [
                'category_id' => $transacao->category_id,
                'category_name' => optional($transacao->category)->name,
                'category_icon' => optional($transacao->category)->icon,
                'category_color' => optional($transacao->category)->color,
                'amount' => (float) $transacao->amount,
                'is_recurring' => $transacao->is_recurring,
            ];
        })->values()->all();

        $creditRows = $creditEntriesForMonth->map(function (Transacao $transacao) {
            $installments = max((int) ($transacao->total_installments ?? 1), 1);
            $installmentAmount = (float) $transacao->amount / $installments;

            return [
                'category_id' => $transacao->category_id,
                'category_name' => optional($transacao->category)->name,
                'category_icon' => optional($transacao->category)->icon,
                'category_color' => optional($transacao->category)->color,
                'amount' => $installmentAmount,
                'is_recurring' => $transacao->is_recurring,
            ];
        })->values()->all();

        $allRows = collect($debitRows)->merge($creditRows);

        $topSpendingCategories = $allRows
            ->groupBy('category_id')
            ->map(function ($items) {
                $first = $items->first();

                return [
                    'category_id' => $first['category_id'] ?? null,
                    'category_name' => $first['category_name'] ?? 'Sem categoria',
                    'category_icon' => $first['category_icon'] ?? null,
                    'category_color' => $first['category_color'] ?? null,
                    'total' => (float) $items->sum('amount'),
                ];
            })
            ->sortByDesc('total')
            ->take(6)
            ->values()
            ->all();

        $totalRecurring = $allRows->where('is_recurring', true)->sum('amount');
        $totalNonRecurring = $allRows->where('is_recurring', false)->sum('amount');
        $totalAmount = $totalRecurring + $totalNonRecurring;

        $recurringPercentage = $totalAmount > 0 ? round(($totalRecurring / $totalAmount) * 100, 1) : 0;
        $nonRecurringPercentage = $totalAmount > 0 ? round(($totalNonRecurring / $totalAmount) * 100, 1) : 0;

        $currentPendingBill = $this->billing->calculatePendingBillFromGroup($effectiveGroup);

        $topSpendingLabel = $effectiveGroup['month_label'] ?? null;

        if (!$topSpendingLabel) {
            $topSpendingLabel = ucfirst(
                $targetMonth
                    ->locale(config('app.locale', 'pt_BR'))
                    ->translatedFormat('F Y')
            );
        }

        $stats['current_month_key'] = $effectiveMonthKey;
        $stats['current_month_label'] = $effectiveGroup['month_label'] ?? null;
        $stats['top_spending_label'] = $topSpendingLabel;
        $stats['current_month_pending_bill'] = (float) $currentPendingBill;
        $stats['current_month_debit_total'] = (float) $currentMonthDebitTotal;
        $stats['monthly_summary'] = $monthlySummary;
        $stats['top_spending_categories'] = $topSpendingCategories;
        $stats['recurring_spending'] = [
            'total' => (float) $totalRecurring,
            'percentage' => $recurringPercentage,
        ];
        $stats['non_recurring_spending'] = [
            'total' => (float) $totalNonRecurring,
            'percentage' => $nonRecurringPercentage,
        ];

        // Calculate total monthly income and remaining money
        $totalMonthlyIncome = (float) Income::forUser($user->id)->active()->sum('amount');
        $remainingMoney = $totalMonthlyIncome - (float) $currentPendingBill - (float) $currentMonthDebitTotal;

        $stats['total_monthly_income'] = $totalMonthlyIncome;
        $stats['remaining_money'] = $remainingMoney;

        $stats['next_card_due_date'] = $this->calculateNextCardDueDateInfo($user, $bankUserId);

        return $stats;
    }

    private function calculateNextCardDueDateInfo(Authenticatable $user, ?int $bankUserId): array
    {
        $today = Carbon::today();

        $cardQuery = CardUser::with('card')
            ->forUser($user->id)
            ->whereNotNull('due_day');

        if ($bankUserId) {
            $cardQuery->where('id', $bankUserId);
        }

        $cards = $cardQuery->get();

        if ($cards->isEmpty()) {
            return ['cards' => [], 'nearest' => null];
        }

        $results = $cards->map(function (CardUser $cardUser) use ($today) {
            $dueDay = (int) $cardUser->due_day;

            $candidateDay = min($dueDay, (int) $today->copy()->endOfMonth()->format('d'));
            $thisMonthDue = $today->copy()->setDay($candidateDay);

            if ($thisMonthDue->lt($today)) {
                $nextMonth = $today->copy()->addMonthNoOverflow();
                $candidateDay = min($dueDay, (int) $nextMonth->endOfMonth()->format('d'));
                $nextDue = $nextMonth->setDay($candidateDay);
            } else {
                $nextDue = $thisMonthDue;
            }

            $daysUntilDue = (int) $today->diffInDays($nextDue);

            return [
                'card_id'        => $cardUser->id,
                'card_name'      => $cardUser->card?->name ?? ('Cartão #' . $cardUser->id),
                'due_day'        => $dueDay,
                'days_until_due' => $daysUntilDue,
                'next_due_date'  => $nextDue->toDateString(),
            ];
        })->sortBy('days_until_due')->values()->all();

        return [
            'cards'   => $results,
            'nearest' => $results[0] ?? null,
        ];
    }

    public function buildDashboardMonthlySummary(
        Authenticatable $user,
        ?int $bankUserId,
        ?int $categoryId,
        Carbon $seriesStart,
        Carbon $seriesEnd,
        $paidByMonth
    ): array {
        $paidByMonth = collect($paidByMonth);

        $debitEntries = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->when($categoryId, function ($q, $categoryId) {
                $q->where('category_id', $categoryId);
            })
            ->where('type', 'debit')
            ->whereBetween('created_at', [$seriesStart, $seriesEnd])
            ->get();

        $debitByMonth = $debitEntries
            ->groupBy(function (Transacao $transacao) {
                return $transacao->created_at instanceof Carbon
                    ? $transacao->created_at->format('Y-m')
                    : Carbon::parse($transacao->created_at)->format('Y-m');
            })
            ->map(function ($items) {
                return (float) $items->sum('amount');
            });

        $months = [];
        $cursor = $seriesStart->copy()->startOfMonth();
        $end = $seriesEnd->copy()->startOfMonth();

        while ($cursor->lte($end)) {
            $monthKey = $cursor->format('Y-m');
            $carbon = $cursor->copy()->startOfMonth();

            $months[] = [
                'month_key' => $monthKey,
                'month_label' => ucfirst($carbon->translatedFormat('M Y')),
                'invoice_total' => (float) $paidByMonth->get($monthKey, 0.0),
                'debit_total' => (float) $debitByMonth->get($monthKey, 0.0),
            ];

            $cursor->addMonth();
        }

        return $months;
    }

    private function calculateBaseStats($base): array
    {
        return [
            'total_income' => (clone $base)
                ->where('type', 'credit')
                ->where('status', 'paid')
                ->sum('amount'),
            'total_expenses' => (clone $base)
                ->where('type', 'debit')
                ->where('status', 'paid')
                ->sum('amount'),
            'pending_income' => (clone $base)
                ->where('type', 'credit')
                ->where('status', '!=', 'paid')
                ->sum('amount'),
            'pending_expenses' => (clone $base)
                ->where('type', 'debit')
                ->where('status', '!=', 'paid')
                ->sum('amount'),
            'overdue_count' => (clone $base)
                ->where('status', 'overdue')
                ->count(),
        ];
    }

    public function getTopSpendingByPeriod(
        Authenticatable $user,
        string $monthFrom,
        string $monthTo,
        ?int $bankUserId = null,
        ?int $categoryId = null
    ): array {
        $startMonth = Carbon::createFromFormat('Y-m', $monthFrom)->startOfMonth();
        $endMonth = Carbon::createFromFormat('Y-m', $monthTo)->endOfMonth();

        $base = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->when($categoryId, function ($q, $categoryId) {
                $q->where('category_id', $categoryId);
            });

        $debitEntries = (clone $base)
            ->with('category')
            ->where('type', 'debit')
            ->where('status', 'paid')
            ->whereBetween('created_at', [$startMonth, $endMonth])
            ->get();

        $creditEntries = (clone $base)
            ->with(['category', 'bankUser'])
            ->where('type', 'credit')
            ->get()
            ->filter(function (Transacao $transacao) use ($startMonth, $endMonth) {
                $cursor = $startMonth->copy()->startOfMonth();
                $limit = $endMonth->copy()->startOfMonth();

                while ($cursor->lte($limit)) {
                    if ($this->billing->faturaAppliesToMonth($transacao, $cursor)) {
                        return true;
                    }
                    $cursor->addMonth();
                }

                return false;
            });

        $debitRows = $debitEntries->map(function (Transacao $transacao) {
            return [
                'category_id'    => $transacao->category_id,
                'category_name'  => optional($transacao->category)->name,
                'category_icon'  => optional($transacao->category)->icon,
                'category_color' => optional($transacao->category)->color,
                'amount'         => (float) $transacao->amount,
                'is_recurring'   => $transacao->is_recurring,
            ];
        })->values()->all();

        $creditRows = $creditEntries->map(function (Transacao $transacao) {
            $installments = max((int) ($transacao->total_installments ?? 1), 1);
            $installmentAmount = (float) $transacao->amount / $installments;

            return [
                'category_id'    => $transacao->category_id,
                'category_name'  => optional($transacao->category)->name,
                'category_icon'  => optional($transacao->category)->icon,
                'category_color' => optional($transacao->category)->color,
                'amount'         => $installmentAmount,
                'is_recurring'   => $transacao->is_recurring,
            ];
        })->values()->all();

        $allRows = collect($debitRows)->merge($creditRows);

        $topSpendingCategories = $allRows
            ->groupBy('category_id')
            ->map(function ($items) {
                $first = $items->first();

                return [
                    'category_id'    => $first['category_id'] ?? null,
                    'category_name'  => $first['category_name'] ?? 'Sem categoria',
                    'category_icon'  => $first['category_icon'] ?? null,
                    'category_color' => $first['category_color'] ?? null,
                    'total'          => (float) $items->sum('amount'),
                ];
            })
            ->sortByDesc('total')
            ->take(6)
            ->values()
            ->all();

        $totalRecurring = $allRows->where('is_recurring', true)->sum('amount');
        $totalNonRecurring = $allRows->where('is_recurring', false)->sum('amount');
        $totalAmount = $totalRecurring + $totalNonRecurring;

        $recurringPercentage = $totalAmount > 0 ? round(($totalRecurring / $totalAmount) * 100, 1) : 0;
        $nonRecurringPercentage = $totalAmount > 0 ? round(($totalNonRecurring / $totalAmount) * 100, 1) : 0;

        $locale = config('app.locale', 'pt_BR');
        $fromLabel = ucfirst(Carbon::createFromFormat('Y-m', $monthFrom)->locale($locale)->translatedFormat('M Y'));
        $toLabel = ucfirst(Carbon::createFromFormat('Y-m', $monthTo)->locale($locale)->translatedFormat('M Y'));
        $periodLabel = $monthFrom === $monthTo ? $fromLabel : "{$fromLabel} — {$toLabel}";

        return [
            'top_spending_categories' => $topSpendingCategories,
            'period_label' => $periodLabel,
            'recurring_spending' => [
                'total' => (float) $totalRecurring,
                'percentage' => $recurringPercentage,
            ],
            'non_recurring_spending' => [
                'total' => (float) $totalNonRecurring,
                'percentage' => $nonRecurringPercentage,
            ],
        ];
    }

    private function paidByMonthForUser(int $userId, ?int $bankUserId = null, bool $shouldFilterByBankUser = false)
    {
        $query = Fatura::where('user_id', $userId);

        if ($shouldFilterByBankUser && !is_null($bankUserId)) {
            $query->where('bank_user_id', $bankUserId);
        } elseif ($shouldFilterByBankUser && is_null($bankUserId)) {
            $query->whereNull('bank_user_id');
        }

        return $query->pluck('total_paid', 'month_key');
    }
}

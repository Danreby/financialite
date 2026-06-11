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
    public function __construct(private FaturaBillingService $billing) {}

    public function buildDashboardData(Authenticatable $user, array $filters): array
    {
        $bankUserId = $filters['bank_user_id'] ?? null;
        $categoryId = $filters['category_id'] ?? null;

        $selectedBankUser = null;

        if ($bankUserId) {
            $selectedBankUser = CardUser::forUser($user->id)->findOrFail($bankUserId);
        }

        $baseQuery = Transacao::with(['bankUser.card', 'user', 'category', 'parcelas'])
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
                    'name' => $cardUser->card?->name ?? ('Cartão #'.$cardUser->id),
                    'due_day' => $cardUser->due_day,
                    'closing_day' => $cardUser->closing_day,
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

        $allFaturas = Transacao::with(['bankUser', 'parcelas'])
            ->forUser($user->id)
            ->forBankUser($bankUserId)
            ->when($categoryId, function ($q, $categoryId) {
                $q->where('category_id', $categoryId);
            })
            ->where('type', 'credit')
            ->orderBy('created_at', 'desc')
            ->get();

        $monthlyGroups = $this->billing->groupFaturasByMonth($allFaturas, $paidByMonth);

        $currentMonthKey = $this->billing->resolveCurrentBillingMonthKey($selectedBankUser);

        $effective = $this->billing->resolveEffectiveGroup($monthlyGroups, $currentMonthKey);
        $effectiveGroup = $effective['group'];
        $effectiveMonthKey = $effective['month_key'];

        $targetMonth = null;

        try {
            $targetMonth = Carbon::parse($effectiveMonthKey.'-01');
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
            ->with(['category', 'bankUser', 'parcelas'])
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

        $creditRows = $creditEntriesForMonth->map(function (Transacao $transacao) use ($effectiveMonthKey) {
            if (! $transacao->is_recurring && $transacao->parcelas->isNotEmpty()) {
                $parcela = $transacao->parcelas->firstWhere('month_key', $effectiveMonthKey);
                $installmentAmount = $parcela
                    ? (float) $transacao->getInstallmentAmount($parcela->installment_number)
                    : (float) $transacao->getInstallmentAmount();
            } else {
                $installmentNumber = $this->billing->resolveInstallmentNumberForMonth($transacao, $effectiveMonthKey);
                $installmentAmount = (float) $transacao->getInstallmentAmount($installmentNumber);
            }

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

        $topSpendingCategories = $this->aggregateCategorySpending($allRows);
        $debitSpendingCategories = $this->aggregateCategorySpending(collect($debitRows));
        $creditSpendingCategories = $this->aggregateCategorySpending(collect($creditRows));

        $totalRecurring = $allRows->where('is_recurring', true)->sum('amount');
        $totalNonRecurring = $allRows->where('is_recurring', false)->sum('amount');
        $totalAmount = $totalRecurring + $totalNonRecurring;

        $recurringPercentage = $totalAmount > 0 ? round(($totalRecurring / $totalAmount) * 100, 1) : 0;
        $nonRecurringPercentage = $totalAmount > 0 ? round(($totalNonRecurring / $totalAmount) * 100, 1) : 0;

        $currentPendingBill = $this->billing->calculatePendingBillFromGroup($effectiveGroup);

        $topSpendingLabel = $effectiveGroup['month_label'] ?? null;

        if (! $topSpendingLabel) {
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
        $stats['debit_spending_categories'] = $debitSpendingCategories;
        $stats['credit_spending_categories'] = $creditSpendingCategories;
        $stats['recurring_spending'] = [
            'total' => (float) $totalRecurring,
            'percentage' => $recurringPercentage,
        ];
        $stats['non_recurring_spending'] = [
            'total' => (float) $totalNonRecurring,
            'percentage' => $nonRecurringPercentage,
        ];

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
            ->where(function ($q) {
                $q->whereNotNull('closing_day')->orWhereNotNull('due_day');
            });

        if ($bankUserId) {
            $cardQuery->where('id', $bankUserId);
        }

        $cards = $cardQuery->get();

        if ($cards->isEmpty()) {
            return ['cards' => [], 'nearest' => null];
        }

        $results = $cards->map(function (CardUser $cardUser) use ($today) {
            $closingDay = $cardUser->closing_day ?? $cardUser->due_day;
            $closingDay = (int) $closingDay;

            $candidateDay = min($closingDay, (int) $today->copy()->endOfMonth()->format('d'));
            $thisMonthClose = $today->copy()->setDay($candidateDay);

            if ($thisMonthClose->lt($today)) {
                $nextMonth = $today->copy()->addMonthNoOverflow();
                $candidateDay = min($closingDay, (int) $nextMonth->endOfMonth()->format('d'));
                $nextClose = $nextMonth->setDay($candidateDay);
            } else {
                $nextClose = $thisMonthClose;
            }

            $daysUntilClose = (int) $today->diffInDays($nextClose);

            return [
                'card_id' => $cardUser->id,
                'card_name' => $cardUser->card?->name ?? ('Cartão #'.$cardUser->id),
                'closing_day' => $closingDay,
                'days_until_due' => $daysUntilClose,
                'next_due_date' => $nextClose->toDateString(),
            ];
        })->sortBy('days_until_due')->values()->all();

        return [
            'cards' => $results,
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

        $monthKeys = [];
        $mk = $seriesStart->copy()->startOfMonth();
        $mkEnd = $seriesEnd->copy()->startOfMonth();
        while ($mk->lte($mkEnd)) {
            $monthKeys[] = $mk->format('Y-m');
            $mk->addMonth();
        }

        $creditByMonth = collect($monthKeys)->mapWithKeys(fn ($k) => [$k => 0.0]);

        $creditTransactions = Transacao::with('parcelas')
            ->forUser($user->id)
            ->forBankUser($bankUserId)
            ->when($categoryId, function ($q, $categoryId) {
                $q->where('category_id', $categoryId);
            })
            ->where('type', 'credit')
            ->get();

        foreach ($creditTransactions as $t) {
            if (! $t->is_recurring && $t->parcelas->isNotEmpty()) {
                foreach ($t->parcelas->whereIn('month_key', $monthKeys) as $parcela) {
                    $creditByMonth[$parcela->month_key] = ($creditByMonth[$parcela->month_key] ?? 0) + (float) $parcela->amount;
                }
            } else {
                $amount = (float) $t->getInstallmentAmount();
                foreach ($monthKeys as $mk) {
                    $mkCarbon = Carbon::parse($mk.'-01');
                    if ($this->billing->faturaAppliesToMonth($t, $mkCarbon)) {
                        $creditByMonth[$mk] = ($creditByMonth[$mk] ?? 0) + $amount;
                    }
                }
            }
        }

        $months = [];
        $cursor = $seriesStart->copy()->startOfMonth();
        $end = $seriesEnd->copy()->startOfMonth();

        while ($cursor->lte($end)) {
            $monthKey = $cursor->format('Y-m');
            $carbon = $cursor->copy()->startOfMonth();

            $months[] = [
                'month_key' => $monthKey,
                'month_label' => ucfirst($carbon->translatedFormat('M Y')),
                'invoice_total' => (float) ($paidByMonth->get($monthKey)?->total_paid ?? 0.0),
                'credit_total' => round((float) ($creditByMonth[$monthKey] ?? 0.0), 2),
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
        $startMonth = Carbon::parse($monthFrom.'-01');
        $endMonth = Carbon::parse($monthTo.'-01')->endOfMonth();

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

        $monthKeys = [];
        $mkCursor = $startMonth->copy()->startOfMonth();
        $mkEnd = $endMonth->copy()->startOfMonth();
        while ($mkCursor->lte($mkEnd)) {
            $monthKeys[] = $mkCursor->format('Y-m');
            $mkCursor->addMonth();
        }

        $creditEntries = (clone $base)
            ->with(['category', 'bankUser', 'parcelas'])
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
                'category_id' => $transacao->category_id,
                'category_name' => optional($transacao->category)->name,
                'category_icon' => optional($transacao->category)->icon,
                'category_color' => optional($transacao->category)->color,
                'amount' => (float) $transacao->amount,
                'is_recurring' => $transacao->is_recurring,
            ];
        })->values()->all();

        $creditRows = $creditEntries->flatMap(function (Transacao $transacao) use ($monthKeys) {
            $rows = [];

            if (! $transacao->is_recurring && $transacao->parcelas->isNotEmpty()) {
                $matchingParcelas = $transacao->parcelas->whereIn('month_key', $monthKeys);
                $totalAmount = $matchingParcelas->sum('amount');

                if ($totalAmount > 0) {
                    $rows[] = [
                        'category_id' => $transacao->category_id,
                        'category_name' => optional($transacao->category)->name,
                        'category_icon' => optional($transacao->category)->icon,
                        'category_color' => optional($transacao->category)->color,
                        'amount' => (float) $totalAmount,
                        'is_recurring' => $transacao->is_recurring,
                    ];
                }
            } else {
                $count = 0;
                foreach ($monthKeys as $mk) {
                    $mkCarbon = Carbon::parse($mk.'-01');
                    if ($this->billing->faturaAppliesToMonth($transacao, $mkCarbon)) {
                        $count++;
                    }
                }
                if ($count > 0) {
                    $rows[] = [
                        'category_id' => $transacao->category_id,
                        'category_name' => optional($transacao->category)->name,
                        'category_icon' => optional($transacao->category)->icon,
                        'category_color' => optional($transacao->category)->color,
                        'amount' => (float) $transacao->getInstallmentAmount() * $count,
                        'is_recurring' => $transacao->is_recurring,
                    ];
                }
            }

            return $rows;
        })->values()->all();

        $allRows = collect($debitRows)->merge($creditRows);

        $topSpendingCategories = $this->aggregateCategorySpending($allRows);
        $debitSpendingCategories = $this->aggregateCategorySpending(collect($debitRows));
        $creditSpendingCategories = $this->aggregateCategorySpending(collect($creditRows));

        $totalRecurring = $allRows->where('is_recurring', true)->sum('amount');
        $totalNonRecurring = $allRows->where('is_recurring', false)->sum('amount');
        $totalAmount = $totalRecurring + $totalNonRecurring;

        $recurringPercentage = $totalAmount > 0 ? round(($totalRecurring / $totalAmount) * 100, 1) : 0;
        $nonRecurringPercentage = $totalAmount > 0 ? round(($totalNonRecurring / $totalAmount) * 100, 1) : 0;

        $locale = config('app.locale', 'pt_BR');
        $fromLabel = ucfirst(Carbon::parse($monthFrom.'-01')->locale($locale)->translatedFormat('M Y'));
        $toLabel = ucfirst(Carbon::parse($monthTo.'-01')->locale($locale)->translatedFormat('M Y'));
        $periodLabel = $monthFrom === $monthTo ? $fromLabel : "{$fromLabel} — {$toLabel}";

        return [
            'top_spending_categories' => $topSpendingCategories,
            'debit_spending_categories' => $debitSpendingCategories,
            'credit_spending_categories' => $creditSpendingCategories,
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

    private function paidByMonthForUser(int $userId, ?int $bankUserId = null, bool $shouldFilterByBankUser = false): \Illuminate\Support\Collection
    {
        $query = Fatura::where('user_id', $userId);

        if ($shouldFilterByBankUser && ! is_null($bankUserId)) {
            $query->where('bank_user_id', $bankUserId);
        } elseif ($shouldFilterByBankUser && is_null($bankUserId)) {
            $query->whereNull('bank_user_id');
        }

        $results = $query->get();

        if (! $shouldFilterByBankUser) {
            return $results->groupBy('month_key')->map(function ($faturas) {
                return (object) [
                    'total_paid' => (float) $faturas->sum('total_paid'),
                    'paid_at' => $faturas->max('paid_at'),
                ];
            });
        }

        return $results->keyBy('month_key');
    }

    private function aggregateCategorySpending($rows): array
    {
        return $rows
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
            ->values()
            ->all();
    }
}

<?php

namespace App\Services;

use App\Contracts\Services\ResumoMensalServiceInterface;
use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Category;
use App\Models\Fatura;
use App\Models\Income;
use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;

class ResumoMensalService implements ResumoMensalServiceInterface
{
    public function __construct(private FaturaBillingService $billing)
    {
    }

    public function buildResumoMensal(Authenticatable $user, array $filters = []): array
    {
        $userId = $user->id;
        $monthKey = $filters['month_key'] ?? Carbon::today()->format('Y-m');

        $targetMonth = Carbon::createFromFormat('Y-m', $monthKey)->startOfMonth();
        $targetMonthEnd = $targetMonth->copy()->endOfMonth();

        $incomes = $this->buildIncomes($userId, $targetMonth);
        $expensesByCategory = $this->buildExpensesByCategory($userId, $targetMonth, $targetMonthEnd);
        $calendarDays = $this->buildCalendar($userId, $targetMonth, $targetMonthEnd);
        $expensesByCard = $this->buildExpensesByCard($userId, $targetMonth, $targetMonthEnd);
        $expensesByBank = $this->buildExpensesByBank($userId, $targetMonth, $targetMonthEnd);
        $categoryAverages = $this->buildCategoryAverages($userId, $targetMonth);

        $totalIncome = collect($incomes)->sum('amount');
        $totalExpenses = collect($expensesByCategory)->sum('total');
        $balance = $totalIncome - $totalExpenses;

        return [
            'month_key' => $monthKey,
            'month_label' => ucfirst($targetMonth->locale('pt_BR')->translatedFormat('F \\d\\e Y')),
            'summary' => [
                'total_income' => round($totalIncome, 2),
                'total_expenses' => round($totalExpenses, 2),
                'balance' => round($balance, 2),
            ],
            'incomes' => $incomes,
            'expenses_by_category' => $expensesByCategory,
            'category_averages' => $categoryAverages,
            'calendar' => $calendarDays,
            'expenses_by_card' => $expensesByCard,
            'expenses_by_bank' => $expensesByBank,
        ];
    }

    private function buildIncomes(int $userId, Carbon $targetMonth): array
    {
        $recurringIncomes = Income::forUser($userId)
            ->active()
            ->recurring()
            ->with('bankUser.card', 'bankAccount.bank')
            ->orderBy('title')
            ->get()
            ->map(fn (Income $income) => [
                'id' => $income->id,
                'title' => $income->title,
                'description' => $income->description,
                'amount' => (float) $income->amount,
                'type' => $income->type,
                'type_label' => $income->type_label,
                'payment_day_label' => $income->payment_day_label,
                'is_recurring' => true,
                'bank_name' => optional($income->bankUser?->card)->name,
                'bank_account_name' => optional($income->bankAccount?->bank)->name,
            ]);

        $oneTimeIncomes = Income::forUser($userId)
            ->active()
            ->oneTime()
            ->with('bankUser.card', 'bankAccount.bank')
            ->whereYear('received_at', $targetMonth->year)
            ->whereMonth('received_at', $targetMonth->month)
            ->orderByDesc('received_at')
            ->get()
            ->map(fn (Income $income) => [
                'id' => $income->id,
                'title' => $income->title,
                'description' => $income->description,
                'amount' => (float) $income->amount,
                'type' => $income->type,
                'type_label' => $income->type_label,
                'payment_day_label' => $income->received_at
                    ? $income->received_at->format('d/m/Y')
                    : null,
                'is_recurring' => false,
                'bank_name' => optional($income->bankUser?->card)->name,
                'bank_account_name' => optional($income->bankAccount?->bank)->name,
            ]);

        return $recurringIncomes->merge($oneTimeIncomes)->values()->toArray();
    }

    private function buildExpensesByCategory(int $userId, Carbon $targetMonth, Carbon $targetMonthEnd): array
    {
        $monthKey = $targetMonth->format('Y-m');

        $debitTransactions = Transacao::with('category')
            ->forUser($userId)
            ->where('type', 'debit')
            ->whereBetween('created_at', [$targetMonth, $targetMonthEnd])
            ->get();

        $creditTransactions = Transacao::with(['category', 'bankUser', 'parcelas'])
            ->forUser($userId)
            ->where('type', 'credit')
            ->get()
            ->filter(fn (Transacao $t) => $this->billing->faturaAppliesToMonth($t, $targetMonth));

        $allRows = collect();

        foreach ($debitTransactions as $t) {
            $allRows->push([
                'category_id' => $t->category_id,
                'category_name' => optional($t->category)->name ?? 'Sem categoria',
                'category_icon' => optional($t->category)->icon,
                'category_color' => optional($t->category)->color,
                'amount' => (float) $t->amount,
            ]);
        }

        foreach ($creditTransactions as $t) {
            if (!$t->is_recurring && $t->parcelas->isNotEmpty()) {
                $parcela = $t->parcelas->firstWhere('month_key', $monthKey);
                $amount = $parcela
                    ? (float) $t->getInstallmentAmount($parcela->installment_number)
                    : (float) $t->getInstallmentAmount();
            } else {
                $installmentNumber = $this->billing->resolveInstallmentNumberForMonth($t, $monthKey);
                $amount = (float) $t->getInstallmentAmount($installmentNumber);
            }

            $allRows->push([
                'category_id' => $t->category_id,
                'category_name' => optional($t->category)->name ?? 'Sem categoria',
                'category_icon' => optional($t->category)->icon,
                'category_color' => optional($t->category)->color,
                'amount' => $amount,
            ]);
        }

        return $allRows->groupBy('category_id')
            ->map(function ($items) {
                $first = $items->first();
                return [
                    'category_id' => $first['category_id'],
                    'category_name' => $first['category_name'],
                    'category_icon' => $first['category_icon'],
                    'category_color' => $first['category_color'],
                    'total' => round($items->sum('amount'), 2),
                    'count' => $items->count(),
                ];
            })
            ->sortByDesc('total')
            ->values()
            ->toArray();
    }

    private function buildCalendar(int $userId, Carbon $targetMonth, Carbon $targetMonthEnd): array
    {
        $monthKey = $targetMonth->format('Y-m');

        $debitTransactions = Transacao::with(['category', 'bankUser.card'])
            ->forUser($userId)
            ->where('type', 'debit')
            ->whereBetween('created_at', [$targetMonth, $targetMonthEnd])
            ->orderByDesc('created_at')
            ->get();

        $creditTransactions = Transacao::with(['category', 'bankUser.card', 'parcelas'])
            ->forUser($userId)
            ->where('type', 'credit')
            ->orderByDesc('created_at')
            ->get()
            ->filter(fn (Transacao $t) => $this->billing->faturaAppliesToMonth($t, $targetMonth));

        $allTransactions = $debitTransactions->merge($creditTransactions);

        $grouped = $allTransactions->groupBy(function ($t) {
            $date = $t->created_at instanceof Carbon ? $t->created_at : Carbon::parse($t->created_at);
            return $date->format('Y-m-d');
        });

        $days = [];
        $cursor = $targetMonth->copy();

        while ($cursor->lte($targetMonthEnd)) {
            $dateKey = $cursor->format('Y-m-d');
            $dayTransactions = $grouped->get($dateKey, collect());

            $items = $dayTransactions->map(function (Transacao $t) use ($monthKey) {
                if ($t->type === 'credit') {
                    if (!$t->is_recurring && $t->parcelas->isNotEmpty()) {
                        $parcela = $t->parcelas->firstWhere('month_key', $monthKey);
                        $displayAmount = $parcela
                            ? (float) $t->getInstallmentAmount($parcela->installment_number)
                            : (float) $t->getInstallmentAmount();
                    } else {
                        $installmentNumber = $this->billing->resolveInstallmentNumberForMonth($t, $monthKey);
                        $displayAmount = (float) $t->getInstallmentAmount($installmentNumber);
                    }
                } else {
                    $displayAmount = (float) $t->amount;
                }

                return [
                    'id' => $t->id,
                    'title' => $t->title,
                    'amount' => round($displayAmount, 2),
                    'type' => $t->type,
                    'status' => $t->status,
                    'category_name' => optional($t->category)->name,
                    'category_icon' => optional($t->category)->icon,
                    'category_color' => optional($t->category)->color,
                    'bank_name' => optional($t->bankUser?->card)->name,
                ];
            })->values()->toArray();

            $dayTotal = collect($items)->sum('amount');

            $days[] = [
                'date' => $dateKey,
                'day' => (int) $cursor->format('d'),
                'weekday' => $cursor->dayOfWeek,
                'transactions' => $items,
                'total' => round($dayTotal, 2),
                'count' => count($items),
            ];

            $cursor->addDay();
        }

        return $days;
    }

    private function buildExpensesByCard(int $userId, Carbon $targetMonth, Carbon $targetMonthEnd): array
    {
        $monthKey = $targetMonth->format('Y-m');

        $creditTransactions = Transacao::with(['category', 'bankUser.card', 'parcelas'])
            ->forUser($userId)
            ->where('type', 'credit')
            ->whereNotNull('bank_user_id')
            ->get()
            ->filter(fn (Transacao $t) => $this->billing->faturaAppliesToMonth($t, $targetMonth));

        return $creditTransactions->groupBy('bank_user_id')
            ->map(function ($items) use ($monthKey) {
                $first = $items->first();
                $cardName = optional($first->bankUser?->card)->name ?? 'Cartão desconhecido';

                $transactions = $items->map(function (Transacao $t) use ($monthKey) {
                    $totalInstallments = max((int) ($t->total_installments ?? 1), 1);

                    if (!$t->is_recurring && $t->parcelas->isNotEmpty()) {
                        $parcela = $t->parcelas->firstWhere('month_key', $monthKey);
                        $installmentNumber = $parcela ? $parcela->installment_number : 1;
                        $amount = $parcela
                            ? (float) $t->getInstallmentAmount($parcela->installment_number)
                            : (float) $t->getInstallmentAmount();
                    } else {
                        $installmentNumber = $this->billing->resolveInstallmentNumberForMonth($t, $monthKey);
                        $amount = (float) $t->getInstallmentAmount($installmentNumber);
                    }

                    return [
                        'id' => $t->id,
                        'title' => $t->title,
                        'amount' => round($amount, 2),
                        'total_amount' => (float) $t->amount,
                        'installments' => $totalInstallments > 1
                            ? "{$installmentNumber}/{$totalInstallments}"
                            : null,
                        'category_name' => optional($t->category)->name,
                        'category_icon' => optional($t->category)->icon,
                        'category_color' => optional($t->category)->color,
                        'date' => $t->created_at?->format('d/m'),
                        'is_recurring' => (bool) $t->is_recurring,
                    ];
                })->sortByDesc('amount')->values()->toArray();

                $total = collect($transactions)->sum('amount');

                return [
                    'bank_user_id' => $first->bank_user_id,
                    'card_name' => $cardName,
                    'total' => round($total, 2),
                    'count' => count($transactions),
                    'transactions' => $transactions,
                ];
            })
            ->sortByDesc('total')
            ->values()
            ->toArray();
    }

    private function buildExpensesByBank(int $userId, Carbon $targetMonth, Carbon $targetMonthEnd): array
    {
        $debitTransactions = Transacao::with(['category', 'bankUser.card'])
            ->forUser($userId)
            ->where('type', 'debit')
            ->whereBetween('created_at', [$targetMonth, $targetMonthEnd])
            ->get();

        $withBank = $debitTransactions->filter(fn ($t) => $t->bank_user_id !== null);
        $withoutBank = $debitTransactions->filter(fn ($t) => $t->bank_user_id === null);

        $groups = $withBank->groupBy('bank_user_id')
            ->map(function ($items) {
                $first = $items->first();
                $bankName = optional($first->bankUser?->card)->name ?? 'Banco desconhecido';

                $transactions = $items->map(function (Transacao $t) {
                    return [
                        'id' => $t->id,
                        'title' => $t->title,
                        'amount' => (float) $t->amount,
                        'category_name' => optional($t->category)->name,
                        'category_icon' => optional($t->category)->icon,
                        'category_color' => optional($t->category)->color,
                        'date' => $t->created_at?->format('d/m'),
                        'is_recurring' => (bool) $t->is_recurring,
                    ];
                })->sortByDesc('amount')->values()->toArray();

                $total = collect($transactions)->sum('amount');

                return [
                    'bank_user_id' => $first->bank_user_id,
                    'bank_name' => $bankName,
                    'total' => round($total, 2),
                    'count' => count($transactions),
                    'transactions' => $transactions,
                ];
            })
            ->sortByDesc('total')
            ->values();

        if ($withoutBank->isNotEmpty()) {
            $noAccountTransactions = $withoutBank->map(function (Transacao $t) {
                return [
                    'id' => $t->id,
                    'title' => $t->title,
                    'amount' => (float) $t->amount,
                    'category_name' => optional($t->category)->name,
                    'category_icon' => optional($t->category)->icon,
                    'category_color' => optional($t->category)->color,
                    'date' => $t->created_at?->format('d/m'),
                    'is_recurring' => (bool) $t->is_recurring,
                ];
            })->sortByDesc('amount')->values()->toArray();

            $total = collect($noAccountTransactions)->sum('amount');

            $groups->push([
                'bank_user_id' => null,
                'bank_name' => 'Sem banco',
                'total' => round($total, 2),
                'count' => count($noAccountTransactions),
                'transactions' => $noAccountTransactions,
            ]);
        }

        return $groups->toArray();
    }

    private function buildCategoryAverages(int $userId, Carbon $targetMonth): array
    {
        $threeMonthsAgo = $targetMonth->copy()->subMonths(3)->startOfMonth();
        $targetMonthEnd = $targetMonth->copy()->endOfMonth();

        // Build the list of month keys in the 4-month range.
        $monthKeys = [];
        $cursor = $threeMonthsAgo->copy();
        while ($cursor->lte($targetMonth)) {
            $monthKeys[] = $cursor->format('Y-m');
            $cursor->addMonth();
        }

        $debitTransactions = Transacao::with('category')
            ->forUser($userId)
            ->where('type', 'debit')
            ->whereBetween('created_at', [$threeMonthsAgo, $targetMonthEnd])
            ->get();

        $creditTransactions = Transacao::with(['category', 'bankUser', 'parcelas'])
            ->forUser($userId)
            ->where('type', 'credit')
            ->get();

        $allRows = collect();

        foreach ($debitTransactions as $t) {
            $date = $t->created_at instanceof Carbon ? $t->created_at : Carbon::parse($t->created_at);
            $allRows->push([
                'category_id' => $t->category_id,
                'category_name' => optional($t->category)->name ?? 'Sem categoria',
                'category_icon' => optional($t->category)->icon,
                'category_color' => optional($t->category)->color,
                'month_key' => $date->format('Y-m'),
                'amount' => (float) $t->amount,
            ]);
        }

        foreach ($creditTransactions as $t) {
            if (!$t->is_recurring && $t->parcelas->isNotEmpty()) {
                // Iterate only parcelas within the target month range.
                foreach ($t->parcelas->whereIn('month_key', $monthKeys) as $parcela) {
                    $allRows->push([
                        'category_id' => $t->category_id,
                        'category_name' => optional($t->category)->name ?? 'Sem categoria',
                        'category_icon' => optional($t->category)->icon,
                        'category_color' => optional($t->category)->color,
                        'month_key' => $parcela->month_key,
                        'amount' => (float) $t->getInstallmentAmount($parcela->installment_number),
                    ]);
                }
            } else {
                // Recurring or no parcelas: check each month via billing service.
                foreach ($monthKeys as $mk) {
                    $mkCarbon = Carbon::createFromFormat('Y-m', $mk)->startOfMonth();
                    if ($this->billing->faturaAppliesToMonth($t, $mkCarbon)) {
                        $installmentNumber = $this->billing->resolveInstallmentNumberForMonth($t, $mk);
                        $allRows->push([
                            'category_id' => $t->category_id,
                            'category_name' => optional($t->category)->name ?? 'Sem categoria',
                            'category_icon' => optional($t->category)->icon,
                            'category_color' => optional($t->category)->color,
                            'month_key' => $mk,
                            'amount' => (float) $t->getInstallmentAmount($installmentNumber),
                        ]);
                    }
                }
            }
        }

        $monthCount = 4;

        $currentMonthByCategory = $allRows
            ->filter(fn ($r) => $r['month_key'] === $targetMonth->format('Y-m'))
            ->groupBy('category_id')
            ->map(fn ($items) => round($items->sum('amount'), 2));

        return $allRows->groupBy('category_id')
            ->map(function ($items) use ($monthCount, $currentMonthByCategory) {
                $first = $items->first();
                $totalAll = $items->sum('amount');
                $average = round($totalAll / $monthCount, 2);
                $currentTotal = $currentMonthByCategory->get($first['category_id'], 0);
                $diff = round($currentTotal - $average, 2);
                $diffPercent = $average > 0 ? round(($diff / $average) * 100, 1) : 0;

                return [
                    'category_id' => $first['category_id'],
                    'category_name' => $first['category_name'],
                    'category_icon' => $first['category_icon'],
                    'category_color' => $first['category_color'],
                    'current_total' => $currentTotal,
                    'average' => $average,
                    'diff' => $diff,
                    'diff_percent' => $diffPercent,
                ];
            })
            ->sortByDesc('current_total')
            ->values()
            ->toArray();
    }
}

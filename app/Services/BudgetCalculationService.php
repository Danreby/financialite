<?php

namespace App\Services;

use App\Models\Transacao;
use App\Models\Fatura;
use App\Models\CardUser;
use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;

class BudgetCalculationService
{
    private ?array $cachedEffectiveGroup = null;
    private ?string $cachedGroupKey = null;

    public function __construct(
        private FaturaBillingService $billing
    ) {}

    private function getEffectiveCreditGroup(
        Authenticatable $user,
        ?int $bankUserId
    ): ?array {
        $cacheKey = $user->id . '-' . ($bankUserId ?? 'null');

        if ($this->cachedGroupKey === $cacheKey) {
            return $this->cachedEffectiveGroup;
        }

        $selectedBankUser = $bankUserId
            ? CardUser::forUser($user->id)->find($bankUserId)
            : null;

        $allCreditTransactions = Transacao::with(['bankUser.card', 'category', 'parcelas'])
            ->forUser($user->id)
            ->forBankUser($bankUserId)
            ->where('type', 'credit')
            ->notStatus('paid')
            ->get();

        if ($allCreditTransactions->isEmpty()) {
            $this->cachedGroupKey = $cacheKey;
            $this->cachedEffectiveGroup = null;
            return null;
        }

        $paidByMonth = Fatura::where('user_id', $user->id)
            ->when($bankUserId, fn($q) => $q->where('bank_user_id', $bankUserId))
            ->get()->keyBy('month_key');

        $monthlyGroups = $this->billing->groupFaturasByMonth($allCreditTransactions, $paidByMonth);
        $currentMonthKey = $this->billing->resolveCurrentBillingMonthKey($selectedBankUser);
        $effective = $this->billing->resolveEffectiveGroup($monthlyGroups, $currentMonthKey);

        $this->cachedGroupKey = $cacheKey;
        $this->cachedEffectiveGroup = $effective['group'];

        return $this->cachedEffectiveGroup;
    }
    public function calculateCategorySpendingWithInvoice(
        Authenticatable $user,
        ?int $bankUserId,
        Carbon $monthStart,
        Carbon $monthEnd,
        string $currentMonth
    ): Collection {
        $debitSpending = $this->getDebitCategorySpending(
            $user,
            $bankUserId,
            $monthStart,
            $monthEnd
        );

        $creditSpending = $this->getCreditCategorySpendingFromInvoice(
            $user,
            $bankUserId,
            $currentMonth
        );

        return $this->mergeCategorySpending($debitSpending, $creditSpending);
    }

    public function calculateTotalMonthlySpending(
        Authenticatable $user,
        ?int $bankUserId,
        Carbon $monthStart,
        Carbon $monthEnd,
        string $currentMonth
    ): float {
        $debitSpent = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->where('type', 'debit')
            ->sum('amount');

        $pendingInvoiceTotal = $this->calculatePendingInvoiceTotal($user, $bankUserId, $currentMonth);

        return (float) ($debitSpent + $pendingInvoiceTotal);
    }

    public function calculatePendingInvoiceTotal(
        Authenticatable $user,
        ?int $bankUserId,
        string $currentMonth
    ): float {
        $effectiveGroup = $this->getEffectiveCreditGroup($user, $bankUserId);

        return $this->billing->calculatePendingBillFromGroup($effectiveGroup);
    }

    private function getDebitCategorySpending(
        Authenticatable $user,
        ?int $bankUserId,
        Carbon $monthStart,
        Carbon $monthEnd
    ): Collection {
        return Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->where('type', 'debit')
            ->whereNotNull('category_id')
            ->selectRaw('category_id, SUM(amount) as spent')
            ->groupBy('category_id')
            ->get()
            ->keyBy('category_id');
    }

    private function getCreditCategorySpendingFromInvoice(
        Authenticatable $user,
        ?int $bankUserId,
        string $currentMonth
    ): Collection {
        $effectiveGroup = $this->getEffectiveCreditGroup($user, $bankUserId);

        if (!$effectiveGroup || ($effectiveGroup['is_paid'] ?? false)) {
            return collect();
        }

        $categorySpending = [];

        foreach ($effectiveGroup['items'] ?? [] as $item) {
            $categoryId = $item['category_id'] ?? null;
            if (!$categoryId) {
                continue;
            }

            $transacaoId = $item['transacao_id'] ?? null;
            $displayInstallment = $item['display_installment'] ?? null;
            $installmentAmount = 0.0;

            if ($transacaoId && $displayInstallment) {
                $parcela = \App\Models\TransacaoParcela::where('transacao_id', $transacaoId)
                    ->where('installment_number', $displayInstallment)
                    ->first();
                $installmentAmount = $parcela ? (float) $parcela->amount : (float) ($item['amount'] ?? 0) / max((int) ($item['total_installments'] ?? 1), 1);
            } else {
                $totalInstallments = max((int) ($item['total_installments'] ?? 1), 1);
                $installmentAmount = (float) ($item['amount'] ?? 0) / $totalInstallments;
            }

            if (!isset($categorySpending[$categoryId])) {
                $categorySpending[$categoryId] = 0;
            }

            $categorySpending[$categoryId] += $installmentAmount;
        }

        return collect($categorySpending)->map(function ($spent, $categoryId) {
            return (object) [
                'category_id' => $categoryId,
                'spent' => $spent,
            ];
        })->keyBy('category_id');
    }

    private function calculateInstallmentAmount(Transacao $transaction): float
    {
        return (float) $transaction->getInstallmentAmount();
    }

    private function mergeCategorySpending(
        Collection $debitSpending,
        Collection $creditSpending
    ): Collection {
        $merged = $debitSpending->map(fn($item) => [
            'category_id' => $item->category_id,
            'spent' => (float) $item->spent,
        ])->keyBy('category_id');

        foreach ($creditSpending as $categoryId => $item) {
            if ($merged->has($categoryId)) {
                $existing = $merged->get($categoryId);
                $existing['spent'] += (float) $item->spent;
                $merged->put($categoryId, $existing);
            } else {
                $merged->put($categoryId, [
                    'category_id' => $categoryId,
                    'spent' => (float) $item->spent,
                ]);
            }
        }

        return $merged;
    }

    public function formatCategoryBudgets(
        Collection $categorySpending,
        Collection $categoryLimits,
        Collection $categories
    ): array {
        return $categoryLimits->map(function ($categoryLimit) use ($categorySpending, $categories) {
            $categoryId = $categoryLimit->category_id;
            $spent = $categorySpending->get($categoryId)['spent'] ?? 0;

            return [
                'categoryName' => $categoryLimit->category?->name ?? $categories->get($categoryId)?->name ?? 'Sem categoria',
                'limit' => round($categoryLimit->limit, 2),
                'spent' => round($spent, 2),
            ];
        })->values()->all();
    }

    public function calculateInstallmentAwareSpending(
        Authenticatable $user,
        ?int $bankUserId,
        Carbon $periodStart,
        Carbon $periodEnd
    ): float {
        $debitTotal = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->where('type', 'debit')
            ->sum('amount');

        $creditTotal = $this->calculateCreditInstallmentSpending(
            $user,
            $bankUserId,
            $periodStart,
            $periodEnd
        );

        return (float) ($debitTotal + $creditTotal);
    }

    public function calculateInstallmentAwareCategorySpending(
        Authenticatable $user,
        ?int $bankUserId,
        Carbon $periodStart,
        Carbon $periodEnd
    ): Collection {
        $debitSpending = Transacao::forUser($user->id)
            ->forBankUser($bankUserId)
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->where('type', 'debit')
            ->whereNotNull('category_id')
            ->selectRaw('category_id, SUM(amount) as spent')
            ->groupBy('category_id')
            ->get()
            ->keyBy('category_id');

        $allCreditTransactions = Transacao::with(['bankUser.card', 'parcelas'])
            ->forUser($user->id)
            ->forBankUser($bankUserId)
            ->where('type', 'credit')
            ->whereNotNull('category_id')
            ->notStatus('paid')
            ->get();

        $creditByCategory = [];
        $monthKeys = $this->getMonthKeysBetween($periodStart, $periodEnd);

        foreach ($allCreditTransactions as $transaction) {
            $categoryId = $transaction->category_id;
            if (!$categoryId) continue;

            foreach ($monthKeys as $monthKey) {
                $targetMonth = Carbon::createFromFormat('Y-m', $monthKey)->startOfMonth();
                
                if ($this->billing->faturaAppliesToMonth($transaction, $targetMonth)) {
                    $installmentNumber = $this->billing->resolveInstallmentNumberForMonth($transaction, $monthKey);
                    $installmentAmount = (float) $transaction->getInstallmentAmount($installmentNumber);

                    if (!isset($creditByCategory[$categoryId])) {
                        $creditByCategory[$categoryId] = 0;
                    }

                    $creditByCategory[$categoryId] += $installmentAmount;
                }
            }
        }

        $creditSpending = collect($creditByCategory)->map(function ($spent, $categoryId) {
            return (object) ['category_id' => $categoryId, 'spent' => $spent];
        })->keyBy('category_id');

        return $this->mergeCategorySpending($debitSpending, $creditSpending);
    }

    private function calculateCreditInstallmentSpending(
        Authenticatable $user,
        ?int $bankUserId,
        Carbon $periodStart,
        Carbon $periodEnd
    ): float {
        $allCreditTransactions = Transacao::with(['bankUser.card', 'parcelas'])
            ->forUser($user->id)
            ->forBankUser($bankUserId)
            ->where('type', 'credit')
            ->notStatus('paid')
            ->get();

        if ($allCreditTransactions->isEmpty()) {
            return 0.0;
        }

        $total = 0.0;
        $monthKeys = $this->getMonthKeysBetween($periodStart, $periodEnd);

        foreach ($allCreditTransactions as $transaction) {
            foreach ($monthKeys as $monthKey) {
                $targetMonth = Carbon::createFromFormat('Y-m', $monthKey)->startOfMonth();
                
                if ($this->billing->faturaAppliesToMonth($transaction, $targetMonth)) {
                    $installmentNumber = $this->billing->resolveInstallmentNumberForMonth($transaction, $monthKey);
                    $installmentAmount = (float) $transaction->getInstallmentAmount($installmentNumber);
                    $total += $installmentAmount;
                }
            }
        }

        return $total;
    }

    private function getMonthKeysBetween(Carbon $start, Carbon $end): array
    {
        $monthKeys = [];
        $current = $start->copy()->startOfMonth();

        while ($current->lte($end)) {
            $monthKeys[] = $current->format('Y-m');
            $current->addMonth();
        }

        return $monthKeys;
    }
}

<?php

namespace App\Services;

use App\Models\Transacao;
use App\Models\Fatura;
use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;

class BudgetCalculationService
{
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

        $currentInvoiceTotal = Fatura::where('user_id', $user->id)
            ->where('month_key', $currentMonth)
            ->when($bankUserId, fn($q) => $q->where('bank_user_id', $bankUserId))
            ->whereNull('paid_at')
            ->sum('total_paid');

        return (float) ($debitSpent + $currentInvoiceTotal);
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
        $invoices = Fatura::where('user_id', $user->id)
            ->where('month_key', $currentMonth)
            ->when($bankUserId, fn($q) => $q->where('bank_user_id', $bankUserId))
            ->whereNull('paid_at')
            ->with(['transacoes' => function ($query) {
                $query->where('type', 'credit')
                    ->whereNotNull('category_id');
            }])
            ->get();

        $categorySpending = [];

        foreach ($invoices as $invoice) {
            foreach ($invoice->transacoes as $transaction) {
                if (!$transaction->category_id) {
                    continue;
                }

                $installmentAmount = $this->calculateInstallmentAmount($transaction);

                if (!isset($categorySpending[$transaction->category_id])) {
                    $categorySpending[$transaction->category_id] = 0;
                }

                $categorySpending[$transaction->category_id] += $installmentAmount;
            }
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
        $amount = (float) $transaction->amount;
        $totalInstallments = (int) ($transaction->total_installments ?? 1);

        $totalInstallments = max($totalInstallments, 1);

        return $amount / $totalInstallments;
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
}

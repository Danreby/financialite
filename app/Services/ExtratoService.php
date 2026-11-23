<?php

namespace App\Services;

use App\Contracts\Services\ExtratoServiceInterface;
use App\Enums\TransacaoStatus;
use App\Enums\TransacaoType;
use App\Models\Income;
use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;

class ExtratoService implements ExtratoServiceInterface
{
    public function buildExtrato(Authenticatable $user, array $filters = []): array
    {
        $userId = $user->id;
        $startDate = $this->resolveDate($filters['start_date'] ?? null, now()->startOfMonth());
        $endDate = $this->resolveDate($filters['end_date'] ?? null, now()->endOfMonth());
        $bankUserId = $filters['bank_user_id'] ?? null;
        $type = $filters['type'] ?? null;
        $categoryId = $filters['category_id'] ?? null;

        $transactions = $this->fetchTransactions($userId, $startDate, $endDate, $bankUserId, $type, $categoryId);
        $incomes = $this->fetchIncomes($userId, $bankUserId);

        $totalIncome = $incomes->sum('amount');
        $totalExpenses = $transactions->where('type', TransacaoType::Debit->value)->sum('amount')
            + $transactions->where('type', TransacaoType::Credit->value)->sum(fn ($t) => $t['installment_amount'] ?? $t['amount']);

        $paidExpenses = $transactions->where('status', TransacaoStatus::Paid->value);
        $unpaidExpenses = $transactions->whereIn('status', [TransacaoStatus::Unpaid->value, TransacaoStatus::Overdue->value]);

        $totalPaid = $paidExpenses->where('type', TransacaoType::Debit->value)->sum('amount')
            + $paidExpenses->where('type', TransacaoType::Credit->value)->sum(fn ($t) => $t['installment_amount'] ?? $t['amount']);

        $totalUnpaid = $unpaidExpenses->where('type', TransacaoType::Debit->value)->sum('amount')
            + $unpaidExpenses->where('type', TransacaoType::Credit->value)->sum(fn ($t) => $t['installment_amount'] ?? $t['amount']);

        $balance = $totalIncome - $totalPaid;

        $grouped = $this->groupByDay($transactions);

        return [
            'transactions' => $grouped,
            'incomes' => $incomes->values()->toArray(),
            'summary' => [
                'total_income' => round($totalIncome, 2),
                'total_expenses' => round($totalExpenses, 2),
                'total_paid' => round($totalPaid, 2),
                'total_unpaid' => round($totalUnpaid, 2),
                'balance' => round($balance, 2),
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
        ];
    }

    private function fetchTransactions(
        int $userId,
        Carbon $startDate,
        Carbon $endDate,
        ?int $bankUserId,
        ?string $type,
        ?int $categoryId
    ): Collection {
        return Transacao::with(['bankUser.card', 'category', 'parcelas'])
            ->forUser($userId)
            ->forBankUser($bankUserId)
            ->when($type && TransacaoType::tryFrom((string) $type) !== null, fn ($q) => $q->where('type', $type))
            ->when($categoryId, fn ($q) => $q->where('category_id', (int) $categoryId))
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Transacao $t) => $this->mapTransaction($t));
    }

    private function fetchIncomes(int $userId, ?int $bankUserId): Collection
    {
        return Income::forUser($userId)
            ->active()
            ->forBankUser($bankUserId)
            ->with('bankUser.card')
            ->orderBy('title')
            ->get()
            ->map(fn (Income $income) => [
                'id' => $income->id,
                'title' => $income->title,
                'description' => $income->description,
                'amount' => (float) $income->amount,
                'type' => $income->type,
                'type_label' => $income->type_label,
                'payment_day_type' => $income->payment_day_type,
                'payment_day_value' => $income->payment_day_value,
                'payment_day_label' => $income->payment_day_label,
                'is_active' => $income->is_active,
                'bank_name' => optional($income->bankUser?->card)->name,
            ]);
    }

    private function mapTransaction(Transacao $t): array
    {
        $installmentAmount = $t->type === TransacaoType::Credit
            ? (float) $t->getInstallmentAmount()
            : (float) $t->amount;

        return [
            'id' => $t->id,
            'title' => $t->title,
            'description' => $t->description,
            'amount' => (float) $t->amount,
            'installment_amount' => round($installmentAmount, 2),
            'type' => $t->type->value,
            'status' => $t->status->value,
            'is_recurring' => (bool) $t->is_recurring,
            'total_installments' => $t->total_installments,
            'current_installment' => $t->current_installment,
            'created_at' => $t->created_at?->toIso8601String(),
            'paid_date' => $t->paid_date?->toIso8601String(),
            'bank_user_id' => $t->bank_user_id,
            'category_id' => $t->category_id,
            'bank_name' => optional($t->bankUser?->card)->name,
            'category_name' => optional($t->category)->name,
            'category_icon' => optional($t->category)->icon,
            'category_color' => optional($t->category)->color,
        ];
    }

    private function groupByDay(Collection $transactions): array
    {
        return $transactions
            ->groupBy(fn ($t) => Carbon::parse($t['created_at'])->toDateString())
            ->map(function ($items, $date) {
                $dayTotal = $items->sum(function ($t) {
                    $value = $t['type'] === TransacaoType::Credit->value
                        ? ($t['installment_amount'] ?? $t['amount'])
                        : $t['amount'];

                    return $t['status'] === TransacaoStatus::Paid->value ? $value : 0;
                });

                return [
                    'date' => $date,
                    'label' => ucfirst(Carbon::parse($date)->translatedFormat('D, d M Y')),
                    'day_total' => round($dayTotal, 2),
                    'transactions' => $items->values()->toArray(),
                ];
            })
            ->sortKeysDesc()
            ->values()
            ->toArray();
    }

    private function resolveDate(?string $dateStr, Carbon $fallback): Carbon
    {
        if (! $dateStr) {
            return $fallback;
        }

        try {
            return Carbon::parse($dateStr);
        } catch (\Exception) {
            return $fallback;
        }
    }
}

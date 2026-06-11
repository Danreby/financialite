<?php

namespace App\Services;

use App\Models\CardUser;
use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class FaturaBillingService
{
    public function resolveBillingMonthKey(Transacao $transacao): string
    {
        $createdAt = $transacao->created_at instanceof Carbon
            ? $transacao->created_at->copy()
            : Carbon::parse($transacao->created_at);

        $closingDay = $transacao->bankUser->closing_day ?? $transacao->bankUser->due_day ?? null;

        if (! $closingDay) {
            return $createdAt->format('Y-m');
        }

        $cutoffDay = min((int) $closingDay, 28);
        $dayOfPurchase = (int) $createdAt->format('d');

        $monthKey = $dayOfPurchase < $cutoffDay
            ? $createdAt->format('Y-m')
            : $createdAt->copy()->addMonth()->format('Y-m');

        return $monthKey;
    }

    public function resolveCurrentBillingMonthKey(?CardUser $cardUser = null): string
    {
        $today = Carbon::today();

        if (! $cardUser) {
            return $today->format('Y-m');
        }

        $closingDay = $cardUser->closing_day ?? $cardUser->due_day ?? null;

        if (! $closingDay) {
            return $today->format('Y-m');
        }

        $cutoffDay = min((int) $closingDay, 28);
        $day = (int) $today->format('d');

        $candidate = $day < $cutoffDay
            ? $today->copy()
            : $today->copy()->addMonth();

        return $candidate->format('Y-m');
    }

    public function faturaAppliesToMonth(Transacao $transacao, Carbon $targetMonth): bool
    {
        $monthKey = $targetMonth->format('Y-m');

        if (! $transacao->is_recurring && $transacao->relationLoaded('parcelas') && $transacao->parcelas->isNotEmpty()) {
            return $transacao->parcelas->contains('month_key', $monthKey);
        }

        $totalInstallments = max((int) ($transacao->total_installments ?? 1), 1);

        $firstBillingMonthKey = $this->resolveBillingMonthKey($transacao);
        $first = Carbon::parse($firstBillingMonthKey.'-01');

        if ($transacao->is_recurring) {
            return ! $targetMonth->lt($first);
        }

        $last = (clone $first)->addMonths($totalInstallments - 1);

        return ! $targetMonth->lt($first) && ! $targetMonth->gt($last);
    }

    public function applyPaymentForMonth(Transacao $transacao, ?string $monthKey = null): float
    {
        $totalInstallments = max((int) ($transacao->total_installments ?? 1), 1);
        $isRecurring = (bool) $transacao->is_recurring;

        if ($isRecurring) {
            return (float) $transacao->getInstallmentAmount();
        }

        if ($totalInstallments <= 1) {
            $transacao->status = 'paid';
            $transacao->paid_date = now()->toDateString();

            $this->markParcelaAsPaid($transacao, 1);

            return (float) $transacao->amount;
        }

        $targetInstallment = null;

        if ($monthKey) {
            if ($transacao->relationLoaded('parcelas') && $transacao->parcelas->isNotEmpty()) {
                $parcela = $transacao->parcelas->firstWhere('month_key', $monthKey);
                if ($parcela) {
                    if ($parcela->status === 'paid') {
                        return 0.0;
                    }
                    $targetInstallment = $parcela->installment_number;
                }
            }

            if (! $targetInstallment) {
                $targetInstallment = $this->resolveInstallmentNumberForMonth($transacao, $monthKey);
            }
        }

        if ($targetInstallment) {
            $installmentAmount = (float) $transacao->getInstallmentAmount($targetInstallment);
            $this->markParcelaAsPaid($transacao, $targetInstallment);

            $highestPaid = $transacao->parcelas()
                ->where('status', 'paid')
                ->max('installment_number') ?? $targetInstallment;
            $transacao->current_installment = (int) $highestPaid;

            $unpaidCount = $transacao->parcelas()
                ->where('status', '!=', 'paid')
                ->count();

            if ($unpaidCount === 0 || (int) $highestPaid >= $totalInstallments) {
                $transacao->status = 'paid';
                $transacao->paid_date = now()->toDateString();
            }

            return $installmentAmount;
        }

        $currentInstallment = max((int) ($transacao->current_installment ?? 0), 0);

        if ($currentInstallment < $totalInstallments) {
            $currentInstallment++;
            $transacao->current_installment = $currentInstallment;
        }

        $this->markParcelaAsPaid($transacao, $currentInstallment);

        if ($currentInstallment >= $totalInstallments) {
            $transacao->status = 'paid';
            $transacao->paid_date = now()->toDateString();
        }

        return (float) $transacao->getInstallmentAmount($currentInstallment);
    }

    private function markParcelaAsPaid(Transacao $transacao, int $installmentNumber): void
    {
        $transacao->parcelas()
            ->where('installment_number', $installmentNumber)
            ->where('status', '!=', 'paid')
            ->update([
                'status' => 'paid',
                'paid_date' => now()->toDateString(),
            ]);
    }

    public function resolveInstallmentNumberForMonth(Transacao $transacao, string $yearMonth): ?int
    {
        $totalInstallments = (int) ($transacao->total_installments ?? 1);
        if ($totalInstallments <= 1) {
            return null;
        }

        if ($transacao->relationLoaded('parcelas') && $transacao->parcelas->isNotEmpty()) {
            $parcela = $transacao->parcelas->firstWhere('month_key', $yearMonth);
            if ($parcela) {
                return $parcela->installment_number;
            }
        }

        $firstBillingMonthKey = $this->resolveBillingMonthKey($transacao);
        $first = Carbon::parse($firstBillingMonthKey.'-01');
        $current = Carbon::parse($yearMonth.'-01');

        if ($current->lt($first)) {
            return null;
        }

        $offset = $first->diffInMonths($current);
        $installment = $offset + 1;

        if ($installment > $totalInstallments) {
            return $totalInstallments;
        }

        return $installment;
    }

    public function groupFaturasByMonth($transacoes, ?Collection $paidByMonth = null): array
    {
        $entries = collect();

        $projectionEnd = Carbon::today()->copy()->addYear()->startOfMonth();

        foreach ($transacoes as $transacao) {
            $totalInstallments = max((int) ($transacao->total_installments ?? 1), 1);
            $isRecurring = (bool) $transacao->is_recurring;

            if (! $isRecurring && $transacao->relationLoaded('parcelas') && $transacao->parcelas->isNotEmpty()) {
                foreach ($transacao->parcelas as $parcela) {
                    if (! $parcela->month_key) {
                        continue;
                    }

                    $parcelaMonth = Carbon::parse($parcela->month_key.'-01');
                    if ($parcelaMonth->gt($projectionEnd)) {
                        continue;
                    }

                    $entries->push([
                        'transacao' => $transacao,
                        'month_key' => $parcela->month_key,
                        'installment_index' => $parcela->installment_number,
                    ]);
                }

                continue;
            }

            $firstBillingMonthKey = $this->resolveBillingMonthKey($transacao);
            $month = Carbon::parse($firstBillingMonthKey.'-01');

            $installmentIndex = 1;

            while (true) {
                if ($month->gt($projectionEnd)) {
                    break;
                }

                if (! $isRecurring && $installmentIndex > $totalInstallments) {
                    break;
                }

                $monthKey = $month->format('Y-m');

                $entries->push([
                    'transacao' => $transacao,
                    'month_key' => $monthKey,
                    'installment_index' => $installmentIndex,
                ]);

                $month = $month->copy()->addMonth();
                $installmentIndex++;
            }
        }

        $grouped = $entries->groupBy('month_key');

        $result = $grouped->map(function ($items, $yearMonth) use ($paidByMonth) {
            $carbon = Carbon::parse($yearMonth.'-01');
            $label = ucfirst($carbon->translatedFormat('F Y'));

            $totalSpent = $items->sum(function ($entry) {
                $transacao = $entry['transacao'];
                $installmentNumber = $entry['installment_index'];

                if ($transacao->relationLoaded('parcelas') && $transacao->parcelas->isNotEmpty()) {
                    $parcela = $transacao->parcelas->firstWhere('installment_number', $installmentNumber);
                    if ($parcela) {
                        return (float) $parcela->amount;
                    }
                }

                return (float) $transacao->getInstallmentAmount($installmentNumber);
            });

            $faturaPayment = $paidByMonth ? $paidByMonth->get($yearMonth) : null;
            $totalPaid = $faturaPayment ? (float) ($faturaPayment->total_paid ?? 0.0) : 0.0;

            $isPaid = $faturaPayment
                && $faturaPayment->paid_at !== null
                && $totalPaid > 0;

            $hasRemainingPostPayment = $faturaPayment
                && $faturaPayment->paid_at !== null
                && $totalPaid > 0
                && $totalSpent > $totalPaid + 0.01;

            if ($hasRemainingPostPayment) {
                $isPaid = false;
            }

            return [
                'month_key' => $yearMonth,
                'month_label' => $label,
                'total_spent' => (float) $totalSpent,
                'total_paid' => $totalPaid,
                'is_paid' => $isPaid,
                'is_partially_paid' => ! $isPaid && $totalPaid > 0,
                'has_remaining_post_payment' => $hasRemainingPostPayment,
                'items' => $items->map(function ($entry) use ($faturaPayment) {
                    $fatura = $entry['transacao'];
                    $installmentIndex = $entry['installment_index'];
                    $monthKey = $entry['month_key'];

                    $parcela = null;
                    $totalInstallments = max((int) ($fatura->total_installments ?? 1), 1);

                    if ($fatura->relationLoaded('parcelas') && $fatura->parcelas->isNotEmpty()) {
                        $parcela = $fatura->parcelas->firstWhere('installment_number', $installmentIndex);
                    }

                    $installmentAmount = $parcela
                        ? (float) $parcela->amount
                        : (float) $fatura->getInstallmentAmount($installmentIndex);

                    $effectiveStatus = $fatura->status;
                    if ($fatura->is_recurring) {
                        $effectiveStatus = ($faturaPayment && $faturaPayment->paid_at)
                            ? 'paid'
                            : 'pending';
                    } elseif ($parcela) {
                        $effectiveStatus = $parcela->status;
                    } elseif ($totalInstallments > 1 && (int) ($fatura->current_installment ?? 0) >= $installmentIndex) {
                        $effectiveStatus = 'paid';
                    }

                    return [
                        'id' => $fatura->id.'-'.$installmentIndex,
                        'transacao_id' => $fatura->id,
                        'title' => $fatura->title,
                        'description' => $fatura->description,
                        'amount' => (float) $fatura->amount,
                        'installment_amount' => $installmentAmount,
                        'type' => $fatura->type,
                        'status' => $effectiveStatus,
                        'created_at' => $fatura->created_at,
                        'paid_date' => $parcela?->paid_date ?? $fatura->paid_date,
                        'due_date' => $parcela?->due_date?->toDateString(),
                        'total_installments' => $fatura->total_installments,
                        'current_installment' => $fatura->current_installment,
                        'display_installment' => $installmentIndex,
                        'is_recurring' => (bool) $fatura->is_recurring,
                        'bank_user_id' => $fatura->bank_user_id,
                        'bank_name' => optional($fatura->bankUser->card ?? null)->name ?? null,
                        'category_id' => $fatura->category_id ?? null,
                        'category_name' => $fatura->category->name ?? null,
                        'category_icon' => $fatura->category->icon ?? null,
                        'category_color' => $fatura->category->color ?? null,
                        'anexos_count' => $fatura->anexos_count ?? $fatura->anexos()->count(),
                    ];
                })->values()->all(),
            ];
        });

        return $result->sortBy('month_key')->values()->all();
    }

    public function resolveEffectiveGroup(array $monthlyGroups, string $currentMonthKey): array
    {
        $groupsCollection = collect($monthlyGroups);

        $effectiveGroup = $groupsCollection->firstWhere('month_key', $currentMonthKey);

        if ($effectiveGroup && ! ($effectiveGroup['is_paid'] ?? false)) {
            return [
                'group' => $effectiveGroup,
                'month_key' => $currentMonthKey,
            ];
        }

        $unpaidGroups = $groupsCollection->filter(function ($group) use ($currentMonthKey) {
            return ! ($group['is_paid'] ?? false) && $group['month_key'] >= $currentMonthKey;
        });

        if ($unpaidGroups->isNotEmpty()) {
            $effectiveGroup = $unpaidGroups->sortBy('month_key')->first();

            return [
                'group' => $effectiveGroup,
                'month_key' => $effectiveGroup['month_key'],
            ];
        }

        return [
            'group' => $effectiveGroup,
            'month_key' => $currentMonthKey,
        ];
    }

    public function calculatePendingBillFromGroup(?array $group): float
    {
        if (! $group || ($group['is_paid'] ?? false)) {
            return 0.0;
        }

        $totalSpent = (float) ($group['total_spent'] ?? 0.0);
        $totalPaid = (float) ($group['total_paid'] ?? 0.0);

        return max(0.0, $totalSpent - $totalPaid);
    }
}

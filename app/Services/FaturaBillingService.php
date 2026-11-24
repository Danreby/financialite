<?php

namespace App\Services;

use App\Enums\TransacaoParcelaStatus;
use App\Enums\TransacaoStatus;
use App\Models\CardUser;
use App\Models\Transacao;
use App\Models\TransacaoParcela;
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
            : $createdAt->copy()->addMonthNoOverflow()->format('Y-m');

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
            : $today->copy()->addMonthNoOverflow();

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

        $last = (clone $first)->addMonthsNoOverflow($totalInstallments - 1);

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
            $transacao->status = TransacaoStatus::Paid;
            $transacao->paid_date = now()->toDateString();

            $this->markParcelaAsPaid($transacao, 1);

            return (float) $transacao->amount;
        }

        $targetInstallment = null;

        if ($monthKey) {
            if ($transacao->relationLoaded('parcelas') && $transacao->parcelas->isNotEmpty()) {
                $parcela = $transacao->parcelas->firstWhere('month_key', $monthKey);
                if ($parcela) {
                    if ($parcela->status === TransacaoParcelaStatus::Paid) {
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
                ->where('status', TransacaoParcelaStatus::Paid)
                ->max('installment_number') ?? $targetInstallment;
            $transacao->current_installment = (int) $highestPaid;

            $unpaidCount = $transacao->parcelas()
                ->where('status', '!=', TransacaoParcelaStatus::Paid)
                ->count();

            if ($unpaidCount === 0 || (int) $highestPaid >= $totalInstallments) {
                $transacao->status = TransacaoStatus::Paid;
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
            $transacao->status = TransacaoStatus::Paid;
            $transacao->paid_date = now()->toDateString();
        }

        return (float) $transacao->getInstallmentAmount($currentInstallment);
    }

    private function markParcelaAsPaid(Transacao $transacao, int $installmentNumber): void
    {
        $transacao->parcelas()
            ->where('installment_number', $installmentNumber)
            ->where('status', '!=', TransacaoParcelaStatus::Paid)
            ->update([
                'status' => TransacaoParcelaStatus::Paid,
                'paid_date' => now()->toDateString(),
            ]);
    }

    /**
     * Valor que uma compra no cartão pesa na fatura do mês, em reais.
     *
     * Parcelada com parcelas gravadas: a parcela daquele mês (ou a primeira, se
     * nenhuma cai no mês). Recorrente ou sem parcelas gravadas: a parcela calculada
     * pelo número do mês.
     */
    public function installmentAmountForMonth(Transacao $transacao, string $yearMonth): float
    {
        if (! $transacao->is_recurring && $transacao->parcelas->isNotEmpty()) {
            $parcela = $transacao->parcelas->firstWhere('month_key', $yearMonth);

            return $parcela
                ? (float) $transacao->getInstallmentAmount($parcela->installment_number)
                : (float) $transacao->getInstallmentAmount();
        }

        return (float) $transacao->getInstallmentAmount(
            $this->resolveInstallmentNumberForMonth($transacao, $yearMonth)
        );
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

        $offset = (int) $first->diffInMonths($current);
        $installment = $offset + 1;

        if ($installment > $totalInstallments) {
            return $totalInstallments;
        }

        return $installment;
    }

    /**
     * Meses de fatura de um lançamento no cartão: um por parcela gravada; sem
     * parcelas, a partir do mês de fatura da compra (recorrente: todo mês até
     * $projectionEnd; parcelado: total_installments meses).
     *
     * @return list<array{month_key: string, installment_index: int}>
     */
    public function billingEntries(Transacao $transacao, Carbon $projectionEnd): array
    {
        $entries = [];
        $totalInstallments = max((int) ($transacao->total_installments ?? 1), 1);
        $isRecurring = (bool) $transacao->is_recurring;

        if (! $isRecurring && $transacao->relationLoaded('parcelas') && $transacao->parcelas->isNotEmpty()) {
            foreach ($transacao->parcelas as $parcela) {
                if (! $parcela->month_key) {
                    continue;
                }

                if (Carbon::parse($parcela->month_key.'-01')->gt($projectionEnd)) {
                    continue;
                }

                $entries[] = [
                    'month_key' => $parcela->month_key,
                    'installment_index' => $parcela->installment_number,
                ];
            }

            return $entries;
        }

        $month = Carbon::parse($this->resolveBillingMonthKey($transacao).'-01');
        $installmentIndex = 1;

        while (! $month->gt($projectionEnd)) {
            if (! $isRecurring && $installmentIndex > $totalInstallments) {
                break;
            }

            $entries[] = [
                'month_key' => $month->format('Y-m'),
                'installment_index' => $installmentIndex,
            ];

            $month = $month->copy()->addMonthNoOverflow();
            $installmentIndex++;
        }

        return $entries;
    }

    public function entryParcela(Transacao $transacao, int $installmentIndex): ?TransacaoParcela
    {
        if ($transacao->relationLoaded('parcelas') && $transacao->parcelas->isNotEmpty()) {
            return $transacao->parcelas->firstWhere('installment_number', $installmentIndex);
        }

        return null;
    }

    /** Valor da parcela $installmentIndex: a gravada, ou a divisão do total. */
    public function entryAmount(Transacao $transacao, int $installmentIndex): float
    {
        $parcela = $this->entryParcela($transacao, $installmentIndex);

        return $parcela
            ? (float) $parcela->amount
            : (float) $transacao->getInstallmentAmount($installmentIndex);
    }

    /**
     * Status de uma parcela na fatura: recorrente segue o pagamento da fatura do
     * mês; parcela gravada usa o próprio status; parcelado sem parcelas gravadas
     * conta como pago até current_installment.
     *
     * @param  object|null  $faturaPayment  registro de PaidInvoicesByMonthQuery do mês
     */
    public function entryStatus(Transacao $transacao, int $installmentIndex, ?object $faturaPayment): string
    {
        if ($transacao->is_recurring) {
            return ($faturaPayment && $faturaPayment->paid_at)
                ? TransacaoParcelaStatus::Paid->value
                : TransacaoParcelaStatus::Pending->value;
        }

        $parcela = $this->entryParcela($transacao, $installmentIndex);
        if ($parcela) {
            return $parcela->status->value;
        }

        $totalInstallments = max((int) ($transacao->total_installments ?? 1), 1);
        if ($totalInstallments > 1 && (int) ($transacao->current_installment ?? 0) >= $installmentIndex) {
            return TransacaoParcelaStatus::Paid->value;
        }

        return $transacao->status->value;
    }

    public function groupFaturasByMonth($transacoes, ?Collection $paidByMonth = null): array
    {
        $entries = collect();

        $projectionEnd = Carbon::today()->copy()->addYear()->startOfMonth();

        foreach ($transacoes as $transacao) {
            foreach ($this->billingEntries($transacao, $projectionEnd) as $entry) {
                $entries->push(['transacao' => $transacao] + $entry);
            }
        }

        $grouped = $entries->groupBy('month_key');

        $result = $grouped->map(function ($items, $yearMonth) use ($paidByMonth) {
            $carbon = Carbon::parse($yearMonth.'-01');
            $label = ucfirst($carbon->translatedFormat('F Y'));

            // Resolve payment record first — needed for recurring status check in totalPending
            $faturaPayment = $paidByMonth ? $paidByMonth->get($yearMonth) : null;
            $totalPaid = $faturaPayment ? (float) ($faturaPayment->total_paid ?? 0.0) : 0.0;

            $totalSpent = $items->sum(
                fn ($entry) => $this->entryAmount($entry['transacao'], $entry['installment_index'])
            );

            // Sum only items that are not yet paid — used as the "A pagar" amount
            $totalPending = $items->sum(function ($entry) use ($faturaPayment) {
                $transacao = $entry['transacao'];
                $installmentNumber = $entry['installment_index'];

                if ($this->entryStatus($transacao, $installmentNumber, $faturaPayment) === TransacaoParcelaStatus::Paid->value) {
                    return 0.0;
                }

                return $this->entryAmount($transacao, $installmentNumber);
            });

            $isPaid = ($totalSpent > 0 && $totalPending < 0.01)
                || ($faturaPayment && $faturaPayment->paid_at !== null && $totalPaid > 0);

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
                'total_pending' => (float) $totalPending,
                'total_paid' => $totalPaid,
                'is_paid' => $isPaid,
                'is_partially_paid' => ! $isPaid && $totalPaid > 0,
                'has_remaining_post_payment' => $hasRemainingPostPayment,
                'items' => $items->map(function ($entry) use ($faturaPayment) {
                    $fatura = $entry['transacao'];
                    $installmentIndex = $entry['installment_index'];
                    $monthKey = $entry['month_key'];

                    $parcela = $this->entryParcela($fatura, $installmentIndex);
                    $installmentAmount = $this->entryAmount($fatura, $installmentIndex);
                    $effectiveStatus = $this->entryStatus($fatura, $installmentIndex, $faturaPayment);

                    return [
                        'id' => $fatura->id.'-'.$installmentIndex,
                        'transacao_id' => $fatura->id,
                        'title' => $fatura->title,
                        'description' => $fatura->description,
                        'amount' => (float) $fatura->amount,
                        'installment_amount' => $installmentAmount,
                        'type' => $fatura->type->value,
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

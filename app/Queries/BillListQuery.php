<?php

namespace App\Queries;

use App\Enums\BillPaymentStatus;
use App\Enums\BillStatus;
use App\Models\Bill;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Lista de contas a pagar da web (GET /bills e página Contas), com estatísticas de
 * pagamento, histórico e se o período atual já foi pago.
 */
class BillListQuery
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function get(User $user): Collection
    {
        return Bill::forUser($user->id)
            ->with([
                'category:id,name,color,icon',
                'payments' => fn ($q) => $q->latest('due_date'),
            ])
            ->orderBy('due_day')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($bill) => $this->enrichBillWithPaymentInfo($bill))
            ->values();
    }

    /** @return array<string, mixed> */
    private function enrichBillWithPaymentInfo(Bill $bill): array
    {
        $data = $bill->toArray();
        unset($data['payments']);

        $paidPayments = $bill->relationLoaded('payments')
            ? $bill->payments->where('status', BillPaymentStatus::Paid)->sortByDesc('due_date')
            : collect();

        $currentYear = Carbon::now()->year;
        $totalPaidThisYear = $paidPayments
            ->filter(fn ($p) => Carbon::parse($p->due_date)->year === $currentYear)
            ->sum(fn ($p) => (float) $p->amount_paid);

        $avgPaid = $paidPayments->count() > 0
            ? round($paidPayments->avg(fn ($p) => (float) $p->amount_paid), 2)
            : 0;

        $lastPayment = $paidPayments->first();

        $data['payment_stats'] = [
            'payments_count' => $paidPayments->count(),
            'total_paid_this_year' => round($totalPaidThisYear, 2),
            'avg_paid' => $avgPaid,
            'last_payment_date' => $lastPayment?->due_date?->format('Y-m-d'),
            'last_payment_amount' => $lastPayment ? (float) $lastPayment->amount_paid : null,
        ];

        $data['payment_history'] = $paidPayments->take(24)->values()->map(fn ($p) => [
            'id' => $p->id,
            'due_date' => $p->due_date->format('Y-m-d'),
            'paid_date' => $p->paid_date?->format('Y-m-d'),
            'amount_due' => (float) $p->amount_due,
            'amount_paid' => (float) $p->amount_paid,
            'status' => $p->status->value,
            'notes' => $p->notes,
        ])->all();

        if ($bill->status !== BillStatus::Active || ! $bill->due_day) {
            $data['is_paid_this_period'] = false;
            $data['next_due_date'] = null;

            return $data;
        }

        $today = Carbon::today();
        $currentPeriodDue = $this->getCurrentPeriodDueDate($bill, $today);

        if (! $currentPeriodDue) {
            $data['is_paid_this_period'] = false;
            $data['next_due_date'] = null;

            return $data;
        }

        $isPaid = $bill->relationLoaded('payments') && $bill->payments->contains(
            fn ($p) => $p->status === BillPaymentStatus::Paid && Carbon::parse($p->due_date)->isSameDay($currentPeriodDue)
        );

        if ($isPaid) {
            $nextDue = $this->getNextPeriodDueDate($bill, $currentPeriodDue);
            $data['is_paid_this_period'] = true;
            $data['next_due_date'] = $nextDue?->format('Y-m-d');
        } else {
            $data['is_paid_this_period'] = false;
            $data['next_due_date'] = $currentPeriodDue->format('Y-m-d');
        }

        return $data;
    }

    private function getCurrentPeriodDueDate(Bill $bill, Carbon $today): ?Carbon
    {
        switch ($bill->recurrence_type) {
            case 'monthly':
                return $today->copy()->day(min($bill->due_day, $today->daysInMonth));

            case 'yearly':
                $startDate = $bill->start_date;
                if (! $startDate) {
                    return null;
                }
                $monthDays = $today->copy()->month($startDate->month)->daysInMonth;
                $candidate = $today->copy()->month($startDate->month)->day(min($bill->due_day, $monthDays));
                if ($candidate->gt($today->copy()->addMonthsNoOverflow(6))) {
                    $candidate->subYear();
                }

                return $candidate;

            case 'none':
                return $bill->start_date ? Carbon::parse($bill->start_date) : null;

            default:
                return null;
        }
    }

    private function getNextPeriodDueDate(Bill $bill, Carbon $currentDue): ?Carbon
    {
        switch ($bill->recurrence_type) {
            case 'monthly':
                $next = $currentDue->copy()->addMonthNoOverflow();

                return $next->day(min($bill->due_day, $next->daysInMonth));

            case 'yearly':
                $next = $currentDue->copy()->addYear();

                return $next->day(min($bill->due_day, $next->daysInMonth));

            default:
                return null;
        }
    }
}

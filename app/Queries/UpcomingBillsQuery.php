<?php

namespace App\Queries;

use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\User;
use Carbon\Carbon;

/**
 * Próximos vencimentos da web (GET /bills/upcoming): contas ativas cujo próximo
 * vencimento cai nos próximos $days dias, com o status do pagamento.
 */
class UpcomingBillsQuery
{
    /**
     * @return list<array<string, mixed>>
     */
    public function get(User $user, int $days): array
    {
        $activeBills = Bill::forUser($user->id)
            ->active()
            ->with(['category:id,name,color,icon', 'payments'])
            ->get();

        $upcomingBills = [];
        $today = Carbon::today();
        $endDate = $today->copy()->addDays($days);

        foreach ($activeBills as $bill) {
            $nextDueDate = $bill->getNextDueDate();

            if ($nextDueDate && $nextDueDate->lte($endDate)) {
                // Check if there's already a payment for this due date
                $payment = BillPayment::where('bill_id', $bill->id)
                    ->whereDate('due_date', $nextDueDate->format('Y-m-d'))
                    ->first();

                $status = $payment ? $payment->status : 'pending';
                $daysUntil = $today->diffInDays($nextDueDate, false);

                // Update status to overdue if it's past due
                if (! $payment && $nextDueDate->lt($today)) {
                    $status = 'overdue';
                }

                $upcomingBills[] = [
                    'id' => $bill->id,
                    'title' => $bill->title,
                    'description' => $bill->description,
                    'amount' => (float) $bill->amount,
                    'due_date' => $nextDueDate->format('Y-m-d'),
                    'days_until' => (int) $daysUntil,
                    'status' => $status,
                    'color' => $bill->color,
                    'icon' => $bill->icon,
                    'category' => $bill->category,
                    'recurrence_type' => $bill->recurrence_type,
                    'payment_id' => $payment?->id,
                ];
            }
        }

        // Sort by due date
        usort($upcomingBills, fn ($a, $b) => strcmp($a['due_date'], $b['due_date']));

        return $upcomingBills;
    }
}

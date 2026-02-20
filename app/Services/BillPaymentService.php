<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

class BillPaymentService
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function markBillAsPaid(
        Bill $bill,
        Authenticatable $user,
        array $paymentData
    ): BillPayment {
        return DB::transaction(function () use ($bill, $user, $paymentData) {
            $dueDate = $paymentData['due_date'];
            $paidDate = $paymentData['paid_date'] ?? now();
            $amountPaid = $paymentData['amount_paid'] ?? $bill->amount ?? 0;
            $notes = $paymentData['notes'] ?? null;

            $payment = $this->createOrUpdatePayment(
                $bill,
                $dueDate,
                $paidDate,
                $amountPaid,
                $notes
            );

            $this->createTransactionRecord(
                $user,
                $bill,
                $amountPaid,
                $paidDate
            );

            $this->notificationService->success(
                $user,
                'Pagamento registrado',
                'O pagamento da conta foi registrado com sucesso.'
            );

            return $payment;
        });
    }

    private function createOrUpdatePayment(
        Bill $bill,
        string $dueDate,
        $paidDate,
        float $amountPaid,
        ?string $notes
    ): BillPayment {
        return BillPayment::updateOrCreate(
            [
                'bill_id' => $bill->id,
                'due_date' => $dueDate,
            ],
            [
                'paid_date' => $paidDate,
                'amount_due' => $bill->amount ?? $amountPaid,
                'amount_paid' => $amountPaid,
                'status' => 'paid',
                'notes' => $notes,
            ]
        );
    }

    private function createTransactionRecord(
        Authenticatable $user,
        Bill $bill,
        float $amount,
        $paidDate
    ): Transacao {
        return Transacao::create([
            'title' => $bill->title,
            'description' => $bill->description 
                ? "Pagamento de conta: {$bill->description}" 
                : "Pagamento de conta",
            'amount' => $amount,
            'type' => 'debit',
            'status' => 'paid',
            'paid_date' => $paidDate,
            'total_installments' => null,
            'current_installment' => null,
            'is_recurring' => $bill->recurrence_type !== 'none',
            'user_id' => $user->id,
            'bank_user_id' => null,
            'category_id' => null,
        ]);
    }

    public function toggleBillStatus(Bill $bill, Authenticatable $user): Bill
    {
        return DB::transaction(function () use ($bill, $user) {
            $newStatus = $bill->status === 'active' ? 'inactive' : 'active';
            $bill->update(['status' => $newStatus]);

            $label = $newStatus === 'active' ? 'ativada' : 'desativada';
            $this->notificationService->info(
                $user,
                'Conta ' . $label,
                'A conta foi ' . $label . ' com sucesso.'
            );

            return $bill->fresh();
        });
    }
}

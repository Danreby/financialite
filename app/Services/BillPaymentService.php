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

    /**
     * Registra (ou refaz) o pagamento de uma conta. Como o pagamento gera um lançamento
     * de débito em transacoes, refazer o mesmo vencimento reaproveita esse lançamento em
     * vez de criar um segundo débito.
     *
     * Contas a pagar não têm conta bancária vinculada: o efeito financeiro é só o
     * lançamento em transacoes. Se um dia a conta passar a debitar um banco, o ponto de
     * ligação com o BankLedgerService é este serviço.
     */
    public function markBillAsPaid(
        Bill $bill,
        Authenticatable $user,
        array $paymentData
    ): BillPayment {
        return DB::transaction(function () use ($bill, $user, $paymentData) {
            $dueDate = Carbon::parse($paymentData['due_date'])->toDateString();
            $paidDate = $paymentData['paid_date'] ?? now();
            $amountPaid = $this->toAmount(
                $this->toCents($paymentData['amount_paid'] ?? $bill->amount ?? 0)
            );
            $notes = $paymentData['notes'] ?? null;

            $payment = BillPayment::where('bill_id', $bill->id)
                ->whereDate('due_date', $dueDate)
                ->lockForUpdate()
                ->first() ?? new BillPayment(['bill_id' => $bill->id, 'due_date' => $dueDate]);

            $transacao = $this->lockLinkedTransacao($payment, $user);

            if ($transacao) {
                $transacao->update(['amount' => $amountPaid, 'paid_date' => $paidDate]);
            } else {
                $transacao = $this->createTransactionRecord($user, $bill, $amountPaid, $paidDate);
            }

            $payment->fill([
                'transacao_id' => $transacao->id,
                'paid_date' => $paidDate,
                'amount_due' => $bill->amount ?? $amountPaid,
                'amount_paid' => $amountPaid,
                'status' => 'paid',
                'notes' => $notes,
            ])->save();

            $this->notificationService->success(
                $user,
                'Pagamento registrado',
                'O pagamento da conta foi registrado com sucesso.'
            );

            return $payment;
        });
    }

    /**
     * Edita um pagamento já registrado e ajusta o lançamento de débito vinculado ao novo
     * valor/data. O pagamento e o lançamento são travados juntos para que duas edições
     * simultâneas não deixem os valores divergentes.
     */
    public function updatePayment(
        Bill $bill,
        int $paymentId,
        Authenticatable $user,
        array $data
    ): BillPayment {
        return DB::transaction(function () use ($bill, $paymentId, $user, $data) {
            $payment = BillPayment::where('bill_id', $bill->id)
                ->whereKey($paymentId)
                ->lockForUpdate()
                ->firstOrFail();

            $amountPaid = $this->toAmount($this->toCents($data['amount_paid']));
            $paidDate = $data['paid_date'] ?? $payment->paid_date;

            $transacao = $this->lockLinkedTransacao($payment, $user);
            $transacao?->update(['amount' => $amountPaid, 'paid_date' => $paidDate]);

            $payment->update([
                'amount_paid' => $amountPaid,
                'amount_due' => $data['amount_due'] ?? $payment->amount_due,
                'paid_date' => $paidDate,
                'notes' => $data['notes'] ?? null,
            ]);

            return $payment->fresh();
        });
    }

    /**
     * Remove o pagamento do histórico e estorna o débito que ele gerou.
     */
    public function deletePayment(Bill $bill, int $paymentId, Authenticatable $user): void
    {
        DB::transaction(function () use ($bill, $paymentId, $user) {
            $payment = BillPayment::where('bill_id', $bill->id)
                ->whereKey($paymentId)
                ->lockForUpdate()
                ->firstOrFail();

            $this->lockLinkedTransacao($payment, $user)?->delete();

            $payment->delete();
        });
    }

    private function lockLinkedTransacao(BillPayment $payment, Authenticatable $user): ?Transacao
    {
        if (! $payment->transacao_id) {
            return null;
        }

        return Transacao::where('user_id', $user->getAuthIdentifier())
            ->whereKey($payment->transacao_id)
            ->lockForUpdate()
            ->first();
    }

    private function toCents(float|int|string|null $value): int
    {
        return (int) round(((float) $value) * 100);
    }

    private function toAmount(int $cents): string
    {
        return sprintf('%d.%02d', intdiv($cents, 100), $cents % 100);
    }

    private function createTransactionRecord(
        Authenticatable $user,
        Bill $bill,
        string $amount,
        $paidDate
    ): Transacao {
        return Transacao::create([
            'title' => $bill->title,
            'description' => $bill->description
                ? "Pagamento de conta: {$bill->description}"
                : "Pagamento de conta: {$bill->title}",
            'amount' => $amount,
            'type' => 'debit',
            'status' => 'paid',
            'paid_date' => $paidDate,
            'total_installments' => 1,
            'current_installment' => 1,
            'is_recurring' => $bill->recurrence_type !== 'none',
            'user_id' => $user->getAuthIdentifier(),
            'bank_user_id' => null,
            'category_id' => $bill->category_id ?? null,
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
                'Conta '.$label,
                'A conta foi '.$label.' com sucesso.'
            );

            return $bill->fresh();
        });
    }
}

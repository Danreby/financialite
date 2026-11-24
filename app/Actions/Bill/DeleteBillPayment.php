<?php

namespace App\Actions\Bill;

use App\Models\Bill;
use App\Models\User;
use App\Services\BillPaymentService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Apaga um pagamento do histórico e estorna o débito (só web: rota bills.payment.destroy).
 */
class DeleteBillPayment
{
    public function __construct(private BillPaymentService $payments) {}

    /**
     * @throws ModelNotFoundException conta de outro usuário ou pagamento de outra conta
     */
    public function handle(User $user, int $billId, int $paymentId): void
    {
        $bill = Bill::forUser($user->id)->findOrFail($billId);

        $this->payments->deletePayment($bill, $paymentId, $user);
    }
}

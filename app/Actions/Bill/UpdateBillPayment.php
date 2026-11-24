<?php

namespace App\Actions\Bill;

use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\User;
use App\Services\BillPaymentService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Edita um pagamento do histórico da conta (só web: rota bills.payment.update).
 */
class UpdateBillPayment
{
    public function __construct(private BillPaymentService $payments) {}

    /**
     * @param  array<string, mixed>  $data  saída de BillPaymentUpdateRequest::validated()
     *
     * @throws ModelNotFoundException conta de outro usuário ou pagamento de outra conta
     */
    public function handle(User $user, int $billId, int $paymentId, array $data): BillPayment
    {
        $bill = Bill::forUser($user->id)->findOrFail($billId);

        return $this->payments->updatePayment($bill, $paymentId, $user, $data);
    }
}

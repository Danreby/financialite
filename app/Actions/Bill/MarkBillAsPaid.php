<?php

namespace App\Actions\Bill;

use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\User;
use App\Services\BillPaymentService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Registra (ou refaz) o pagamento de um vencimento. Usada por
 * BillController::markAsPaid e BillApiController::markAsPaid. O lock e o
 * lançamento de débito ficam no BillPaymentService.
 */
class MarkBillAsPaid
{
    public function __construct(private BillPaymentService $payments) {}

    /**
     * @param  array<string, mixed>  $data  saída de BillMarkPaidRequest::validated()
     *
     * @throws ModelNotFoundException conta de outro usuário
     */
    public function handle(User $user, int $billId, array $data): BillPayment
    {
        $bill = Bill::forUser($user->id)->findOrFail($billId);

        return $this->payments->markBillAsPaid($bill, $user, $data);
    }
}

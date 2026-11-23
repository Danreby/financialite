<?php

namespace App\Actions\Bill;

use App\Models\Bill;
use App\Models\User;
use App\Support\Money;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

/**
 * Edita uma conta a pagar do usuário. Usada por BillController::update e
 * BillApiController::update.
 */
class UpdateBill
{
    /**
     * @param  array<string, mixed>  $data  saída de BillUpdateRequest::validated() (só os campos enviados)
     *
     * @throws ModelNotFoundException conta de outro usuário
     */
    public function handle(User $user, int $id, array $data): Bill
    {
        return DB::transaction(function () use ($user, $id, $data) {
            $bill = Bill::forUser($user->id)->lockForUpdate()->findOrFail($id);

            if (isset($data['amount'])) {
                $data['amount'] = Money::toDecimal(Money::fromDecimal($data['amount']));
            }

            $bill->update($data);

            return $bill;
        });
    }
}

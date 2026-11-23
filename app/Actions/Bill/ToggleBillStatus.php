<?php

namespace App\Actions\Bill;

use App\Enums\BillStatus;
use App\Models\Bill;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

/**
 * Alterna a conta entre ativa e inativa. Usada por BillController::toggleStatus e
 * BillApiController::toggleStatus.
 */
class ToggleBillStatus
{
    /**
     * @throws ModelNotFoundException conta de outro usuário
     */
    public function handle(User $user, int $id): Bill
    {
        return DB::transaction(function () use ($user, $id) {
            $bill = Bill::forUser($user->id)->lockForUpdate()->findOrFail($id);
            $bill->update(['status' => $bill->status === BillStatus::Active ? BillStatus::Inactive : BillStatus::Active]);

            return $bill->fresh();
        });
    }
}

<?php

namespace App\Actions\Bill;

use App\Models\Bill;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Remove (soft delete) uma conta a pagar. Usada por BillController::destroy e
 * BillApiController::destroy.
 */
class DeleteBill
{
    /**
     * @throws ModelNotFoundException conta de outro usuário
     */
    public function handle(User $user, int $id): void
    {
        Bill::forUser($user->id)->findOrFail($id)->delete();
    }
}

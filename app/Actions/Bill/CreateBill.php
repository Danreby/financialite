<?php

namespace App\Actions\Bill;

use App\Enums\BillStatus;
use App\Models\Bill;
use App\Models\User;
use App\Support\Money;

/**
 * Cadastra uma conta a pagar. Usada por BillController::store (web) e
 * BillApiController::store.
 */
class CreateBill
{
    /**
     * @param  array<string, mixed>  $data  saída de BillStoreRequest::validated()
     */
    public function handle(User $user, array $data): Bill
    {
        return Bill::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'amount' => Money::toDecimal(Money::fromDecimal($data['amount'])),
            'recurrence_type' => $data['recurrence_type'],
            'due_day' => $data['due_day'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'] ?? null,
            'color' => $data['color'] ?? '#3b82f6',
            'icon' => $data['icon'] ?? 'FileText',
            'status' => $data['status'] ?? BillStatus::Active,
            'category_id' => $data['category_id'] ?? null,
            'user_id' => $user->id,
        ]);
    }
}

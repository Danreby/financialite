<?php

namespace App\Policies;

use App\Models\Bill;
use App\Models\User;

class BillPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Bill $bill): bool
    {
        return $user->id === $bill->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Bill $bill): bool
    {
        return $user->id === $bill->user_id;
    }

    public function delete(User $user, Bill $bill): bool
    {
        return $user->id === $bill->user_id;
    }
}

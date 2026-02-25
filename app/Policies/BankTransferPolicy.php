<?php

namespace App\Policies;

use App\Models\BankTransfer;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class BankTransferPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, BankTransfer $transfer): bool
    {
        return $transfer->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function delete(User $user, BankTransfer $transfer): bool
    {
        return $transfer->user_id === $user->id;
    }
}

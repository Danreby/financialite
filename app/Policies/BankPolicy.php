<?php

namespace App\Policies;

use App\Models\Bank;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class BankPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Bank $bank): bool
    {
        return $bank->belongsToUser($user->id);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Bank $bank): bool
    {
        return $bank->belongsToUser($user->id);
    }

    public function delete(User $user, Bank $bank): bool
    {
        return $bank->belongsToUser($user->id);
    }

    public function attach(User $user): bool
    {
        return true;
    }
}

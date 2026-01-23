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
        return $bank->users()->where('users.id', $user->id)->exists();
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Bank $bank): bool
    {
        // User can update a bank if they have a relationship with it
        return $bank->users()->where('users.id', $user->id)->exists();
    }

    /**
     * Determine whether the user can delete the bank.
     *
     * @param User $user
     * @param Bank $bank
     * @return bool
     */
    public function delete(User $user, Bank $bank): bool
    {
        // User can delete a bank if they have a relationship with it
        return $bank->users()->where('users.id', $user->id)->exists();
    }

    /**
     * Determine whether the user can attach the bank.
     *
     * @param User $user
     * @return bool
     */
    public function attach(User $user): bool
    {
        return true;
    }
}

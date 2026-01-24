<?php

namespace App\Policies;

use App\Models\BankUser;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class BankUserPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, BankUser $bankUser): bool
    {
        return $this->isOwner($user, $bankUser);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, BankUser $bankUser): bool
    {
        return $this->isOwner($user, $bankUser);
    }

    public function delete(User $user, BankUser $bankUser): bool
    {
        return $this->isOwner($user, $bankUser);
    }

    public function updateDueDay(User $user, BankUser $bankUser): bool
    {
        return $this->isOwner($user, $bankUser);
    }

    protected function isOwner(User $user, BankUser $bankUser): bool
    {
        return $bankUser->user_id === $user->id;
    }
}

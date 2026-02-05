<?php

namespace App\Policies;

use App\Models\Income;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class IncomePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Income $income): bool
    {
        return $this->isOwner($user, $income);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Income $income): bool
    {
        return $this->isOwner($user, $income);
    }

    public function delete(User $user, Income $income): bool
    {
        return $this->isOwner($user, $income);
    }

    public function restore(User $user, Income $income): bool
    {
        return $this->isOwner($user, $income);
    }

    public function forceDelete(User $user, Income $income): bool
    {
        return $this->isOwner($user, $income);
    }

    protected function isOwner(User $user, Income $income): bool
    {
        return $income->user_id === $user->id;
    }
}

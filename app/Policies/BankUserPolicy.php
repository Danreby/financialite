<?php

namespace App\Policies;

use App\Models\BankUser;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Policy for BankUser authorization.
 */
class BankUserPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any bank users.
     *
     * @param User $user
     * @return bool
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the bank user.
     *
     * @param User $user
     * @param BankUser $bankUser
     * @return bool
     */
    public function view(User $user, BankUser $bankUser): bool
    {
        return $this->isOwner($user, $bankUser);
    }

    /**
     * Determine whether the user can create bank users.
     *
     * @param User $user
     * @return bool
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the bank user.
     *
     * @param User $user
     * @param BankUser $bankUser
     * @return bool
     */
    public function update(User $user, BankUser $bankUser): bool
    {
        return $this->isOwner($user, $bankUser);
    }

    /**
     * Determine whether the user can delete the bank user.
     *
     * @param User $user
     * @param BankUser $bankUser
     * @return bool
     */
    public function delete(User $user, BankUser $bankUser): bool
    {
        return $this->isOwner($user, $bankUser);
    }

    /**
     * Determine whether the user can update the due day.
     *
     * @param User $user
     * @param BankUser $bankUser
     * @return bool
     */
    public function updateDueDay(User $user, BankUser $bankUser): bool
    {
        return $this->isOwner($user, $bankUser);
    }

    /**
     * Check if the user is the owner of the bank user.
     *
     * @param User $user
     * @param BankUser $bankUser
     * @return bool
     */
    protected function isOwner(User $user, BankUser $bankUser): bool
    {
        return $bankUser->user_id === $user->id;
    }
}

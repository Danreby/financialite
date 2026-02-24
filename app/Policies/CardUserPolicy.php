<?php

namespace App\Policies;

use App\Models\CardUser;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CardUserPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, CardUser $cardUser): bool
    {
        return $this->isOwner($user, $cardUser);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, CardUser $cardUser): bool
    {
        return $this->isOwner($user, $cardUser);
    }

    public function delete(User $user, CardUser $cardUser): bool
    {
        return $this->isOwner($user, $cardUser);
    }

    public function updateDueDay(User $user, CardUser $cardUser): bool
    {
        return $this->isOwner($user, $cardUser);
    }

    protected function isOwner(User $user, CardUser $cardUser): bool
    {
        return $cardUser->user_id === $user->id;
    }
}

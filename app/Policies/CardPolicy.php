<?php

namespace App\Policies;

use App\Models\Card;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CardPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Card $card): bool
    {
        return $card->belongsToUser($user->id);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Card $card): bool
    {
        return $card->belongsToUser($user->id);
    }

    public function delete(User $user, Card $card): bool
    {
        return $card->belongsToUser($user->id);
    }

    public function attach(User $user): bool
    {
        return true;
    }
}

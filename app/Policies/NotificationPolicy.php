<?php

namespace App\Policies;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class NotificationPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Notification $notification): bool
    {
        return $this->isOwner($user, $notification);
    }

    public function update(User $user, Notification $notification): bool
    {
        return $this->isOwner($user, $notification);
    }

    public function delete(User $user, Notification $notification): bool
    {
        return $this->isOwner($user, $notification);
    }

    public function markAsRead(User $user, Notification $notification): bool
    {
        return $this->isOwner($user, $notification);
    }

    protected function isOwner(User $user, Notification $notification): bool
    {
        return $notification->user_id === $user->id;
    }
}

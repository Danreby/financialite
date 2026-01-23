<?php

namespace App\Policies;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Policy for Notification authorization.
 */
class NotificationPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any notifications.
     *
     * @param User $user
     * @return bool
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the notification.
     *
     * @param User $user
     * @param Notification $notification
     * @return bool
     */
    public function view(User $user, Notification $notification): bool
    {
        return $this->isOwner($user, $notification);
    }

    /**
     * Determine whether the user can update the notification.
     *
     * @param User $user
     * @param Notification $notification
     * @return bool
     */
    public function update(User $user, Notification $notification): bool
    {
        return $this->isOwner($user, $notification);
    }

    /**
     * Determine whether the user can delete the notification.
     *
     * @param User $user
     * @param Notification $notification
     * @return bool
     */
    public function delete(User $user, Notification $notification): bool
    {
        return $this->isOwner($user, $notification);
    }

    /**
     * Determine whether the user can mark the notification as read.
     *
     * @param User $user
     * @param Notification $notification
     * @return bool
     */
    public function markAsRead(User $user, Notification $notification): bool
    {
        return $this->isOwner($user, $notification);
    }

    /**
     * Check if the user is the owner of the notification.
     *
     * @param User $user
     * @param Notification $notification
     * @return bool
     */
    protected function isOwner(User $user, Notification $notification): bool
    {
        return $notification->user_id === $user->id;
    }
}

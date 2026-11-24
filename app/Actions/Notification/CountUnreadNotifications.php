<?php

namespace App\Actions\Notification;

use App\Models\Notification;
use App\Models\User;

/**
 * Notificações não lidas do usuário, sem as linhas internas `__meta:`.
 *
 * Usada por NotificationController (web) e NotificationApiController.
 */
class CountUnreadNotifications
{
    public function handle(User $user): int
    {
        return Notification::forUser($user->id)
            ->unread()
            ->visible()
            ->count();
    }
}

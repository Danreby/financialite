<?php

namespace App\Actions\Notification;

use App\Models\Notification;
use App\Models\User;

/**
 * Apaga as notificações do usuário, preservando as linhas internas `__meta:`.
 *
 * Usada por NotificationController (web) e NotificationApiController.
 */
class ClearNotifications
{
    public function handle(User $user): void
    {
        Notification::forUser($user->id)
            ->visible()
            ->delete();
    }
}

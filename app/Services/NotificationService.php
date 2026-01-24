<?php

namespace App\Services;

use App\Models\Notification;
use Illuminate\Contracts\Auth\Authenticatable;

class NotificationService
{
    public function send(Authenticatable|int $user, string $title, string $message, string $type = 'info'): Notification
    {
        $userId = $user instanceof Authenticatable ? $user->getAuthIdentifier() : $user;

        return Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
        ]);
    }

    public function info(Authenticatable|int $user, string $title, string $message): Notification
    {
        return $this->send($user, $title, $message, 'info');
    }

    public function warning(Authenticatable|int $user, string $title, string $message): Notification
    {
        return $this->send($user, $title, $message, 'warning');
    }

    public function error(Authenticatable|int $user, string $title, string $message): Notification
    {
        return $this->send($user, $title, $message, 'error');
    }
}

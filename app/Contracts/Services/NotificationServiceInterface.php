<?php

namespace App\Contracts\Services;

use App\Models\Notification;
use Illuminate\Contracts\Auth\Authenticatable;

interface NotificationServiceInterface
{
    public function send(
        Authenticatable|int $user,
        string $title,
        string $message,
        string $type = 'info'
    ): Notification;

    public function info(Authenticatable|int $user, string $title, string $message): Notification;

    public function warning(Authenticatable|int $user, string $title, string $message): Notification;

    public function error(Authenticatable|int $user, string $title, string $message): Notification;

    public function success(Authenticatable|int $user, string $title, string $message): Notification;
}

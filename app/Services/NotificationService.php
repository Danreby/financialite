<?php

namespace App\Services;

use App\Mail\NotificationMail;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    private const TYPE_LABELS = [
        'info' => 'Informação',
        'success' => 'Sucesso',
        'warning' => 'Atenção',
        'error' => 'Urgente',
    ];

    private const TYPE_COLORS = [
        'info' => ['accent' => '#3B82F6', 'bg' => '#EFF6FF'],
        'success' => ['accent' => '#10B981', 'bg' => '#ECFDF5'],
        'warning' => ['accent' => '#F59E0B', 'bg' => '#FFFBEB'],
        'error' => ['accent' => '#EF4444', 'bg' => '#FEF2F2'],
    ];

    public function send(Authenticatable|int $user, string $title, string $message, string $type = 'info', bool $sendEmail = false): Notification
    {
        $userId = $user instanceof Authenticatable ? $user->getAuthIdentifier() : $user;

        $notification = Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'type' => $type,
        ]);

        if ($sendEmail) {
            $this->sendEmail($user, $userId, $title, $message, $type);
        }

        return $notification;
    }

    private function sendEmail(Authenticatable|int $user, int $userId, string $title, string $message, string $type): void
    {
        try {
            $userModel = $user instanceof User ? $user : User::find($userId);

            if (! $userModel || ! $userModel->email) {
                return;
            }

            $colors = self::TYPE_COLORS[$type] ?? self::TYPE_COLORS['info'];

            $mailable = (new NotificationMail($title, $message, $type))
                ->with([
                    'accentColor' => $colors['accent'],
                    'accentBg' => $colors['bg'],
                    'typeLabel' => self::TYPE_LABELS[$type] ?? 'Notificação',
                ]);

            Mail::to($userModel->email, $userModel->name)->send($mailable);
        } catch (\Throwable $e) {
            Log::error('NotificationService: falha ao enviar email', [
                'user_id' => $userId,
                'title' => $title,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function success(Authenticatable|int $user, string $title, string $message, bool $sendEmail = false): Notification
    {
        return $this->send($user, $title, $message, 'success', $sendEmail);
    }

    public function info(Authenticatable|int $user, string $title, string $message, bool $sendEmail = false): Notification
    {
        return $this->send($user, $title, $message, 'info', $sendEmail);
    }

    public function warning(Authenticatable|int $user, string $title, string $message, bool $sendEmail = false): Notification
    {
        return $this->send($user, $title, $message, 'warning', $sendEmail);
    }

    public function error(Authenticatable|int $user, string $title, string $message, bool $sendEmail = false): Notification
    {
        return $this->send($user, $title, $message, 'error', $sendEmail);
    }
}

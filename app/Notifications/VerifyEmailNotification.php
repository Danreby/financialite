<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends BaseVerifyEmail
{
    /**
     * Build the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verifique seu endereço de email - ' . config('app.name'))
            ->greeting('Olá, ' . $notifiable->name . '!')
            ->line('Obrigado por se cadastrar no ' . config('app.name') . '.')
            ->line('Por favor, clique no botão abaixo para verificar seu endereço de email.')
            ->action('Verificar Email', $verificationUrl)
            ->line('Este link de verificação expira em ' . Config::get('auth.verification.expire', 60) . ' minutos.')
            ->line('Se você não criou uma conta, nenhuma ação é necessária.')
            ->salutation('Atenciosamente, Equipe ' . config('app.name'));
    }

    /**
     * Get the verification URL for the given notifiable.
     */
    protected function verificationUrl($notifiable): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
    }
}

<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

/**
 * Limita tentativas de login por e-mail+IP e por e-mail (independente do IP).
 * Só tentativas erradas contam; um login correto zera os contadores.
 */
class LoginThrottle
{
    public const MAX_PER_EMAIL_IP = 5;

    public const MAX_PER_EMAIL = 5;

    public const DECAY_SECONDS = 60;

    public function __construct(private readonly string $email, private readonly string $ip) {}

    public static function for(Request $request): self
    {
        return new self((string) $request->input('email'), (string) $request->ip());
    }

    public function emailIpKey(): string
    {
        return Str::transliterate($this->normalizedEmail().'|'.$this->ip);
    }

    public function emailKey(): string
    {
        return 'login-email:'.Str::transliterate($this->normalizedEmail());
    }

    public function tooManyAttempts(): bool
    {
        return RateLimiter::tooManyAttempts($this->emailIpKey(), self::MAX_PER_EMAIL_IP)
            || RateLimiter::tooManyAttempts($this->emailKey(), self::MAX_PER_EMAIL);
    }

    public function availableIn(): int
    {
        return max(
            RateLimiter::availableIn($this->emailIpKey()),
            RateLimiter::availableIn($this->emailKey()),
        );
    }

    public function hit(): void
    {
        RateLimiter::hit($this->emailIpKey(), self::DECAY_SECONDS);
        RateLimiter::hit($this->emailKey(), self::DECAY_SECONDS);
    }

    public function clear(): void
    {
        RateLimiter::clear($this->emailIpKey());
        RateLimiter::clear($this->emailKey());
    }

    private function normalizedEmail(): string
    {
        return Str::lower(trim($this->email));
    }
}

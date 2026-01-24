<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function register(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        event(new Registered($user));

        Log::info('New user registered', [
            'user_id' => $user->id,
            'email' => $user->email,
        ]);

        return $user;
    }

    public function authenticate(array $credentials, bool $remember = false): bool
    {
        if (!Auth::attempt($credentials, $remember)) {
            Log::warning('Failed login attempt', [
                'email' => $credentials['email'],
                'ip' => request()->ip(),
            ]);

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        request()->session()->regenerate();

        Log::info('User logged in', [
            'user_id' => Auth::id(),
            'ip' => request()->ip(),
        ]);

        return true;
    }

    public function logout(): void
    {
        $userId = Auth::id();

        Auth::guard('web')->logout();

        request()->session()->invalidate();
        request()->session()->regenerateToken();

        Log::info('User logged out', ['user_id' => $userId]);
    }

    public function isEmailVerified(?User $user = null): bool
    {
        /** @var User|null $user */
        $user = $user ?? Auth::user();

        if (!$user) {
            return false;
        }

        return $user->hasVerifiedEmail();
    }

    public function sendVerificationEmail(User $user): void
    {
        if (!$user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();

            Log::info('Verification email sent', ['user_id' => $user->id]);
        }
    }

    public function markEmailAsVerified(User $user): bool
    {
        if ($user->hasVerifiedEmail()) {
            return false;
        }

        $user->markEmailAsVerified();

        Log::info('Email verified', ['user_id' => $user->id]);

        return true;
    }

    public function getAuthenticatedUser(): ?array
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            return null;
        }

        return [
            'user' => $user,
            'email_verified' => $user->hasVerifiedEmail(),
        ];
    }
}

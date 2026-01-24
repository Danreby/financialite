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
    /**
     * Register a new user.
     */
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

    /**
     * Attempt to authenticate a user.
     */
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

    /**
     * Log the user out.
     */
    public function logout(): void
    {
        $userId = Auth::id();

        Auth::guard('web')->logout();

        request()->session()->invalidate();
        request()->session()->regenerateToken();

        Log::info('User logged out', ['user_id' => $userId]);
    }

    /**
     * Check if user email is verified.
     */
    public function isEmailVerified(?User $user = null): bool
    {
        $user = $user ?? Auth::user();

        if (!$user) {
            return false;
        }

        return $user->hasVerifiedEmail();
    }

    /**
     * Send email verification notification.
     */
    public function sendVerificationEmail(User $user): void
    {
        if (!$user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();

            Log::info('Verification email sent', ['user_id' => $user->id]);
        }
    }

    /**
     * Mark user email as verified.
     */
    public function markEmailAsVerified(User $user): bool
    {
        if ($user->hasVerifiedEmail()) {
            return false;
        }

        $user->markEmailAsVerified();

        Log::info('Email verified', ['user_id' => $user->id]);

        return true;
    }

    /**
     * Get the authenticated user with verification status.
     */
    public function getAuthenticatedUser(): ?array
    {
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

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Google_Client;

class GoogleAuthController extends Controller
{
    /**
     * Authenticate or register a user using their Google ID token.
     *
     * Flow: React opens Google popup → gets credential (ID token) → POSTs here.
     * No server-side redirect needed.
     */
    public function handleToken(Request $request): JsonResponse
    {
        $request->validate([
            'credential' => ['required', 'string', 'max:4096'],
        ]);

        $throttleKey = 'google-auth:' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 10)) {
            return response()->json([
                'message' => 'Muitas tentativas. Tente novamente em alguns minutos.',
            ], 429);
        }

        RateLimiter::hit($throttleKey, 60);

        $googleUser = $this->verifyGoogleToken($request->credential);

        if (!$googleUser) {
            return response()->json([
                'message' => 'Token do Google inválido ou expirado. Tente novamente.',
            ], 422);
        }

        $googleId = $googleUser['sub'];
        $email = strtolower(trim($googleUser['email']));
        $name = $googleUser['name'] ?? 'Usuário';
        $avatar = $googleUser['picture'] ?? null;

        if (empty($googleUser['email_verified'])) {
            return response()->json([
                'message' => 'Seu e-mail do Google não está verificado.',
            ], 422);
        }

        // 1) Look up by google_id first (fastest, most reliable)
        $user = User::where('google_id', $googleId)->first();

        if (!$user) {
            // 2) Check if an account exists with this email
            $user = User::where('email', $email)->first();

            if ($user) {
                // Link Google to existing account
                $user->update([
                    'google_id' => $googleId,
                    'avatar' => $avatar ?: $user->avatar,
                ]);
            } else {
                // 3) Create brand new user
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'google_id' => $googleId,
                    'avatar' => $avatar,
                    'password' => null,
                    'email_verified_at' => now(),
                ]);

                event(new Registered($user));
            }
        } else {
            // Update avatar on each login
            if ($avatar && $avatar !== $user->avatar) {
                $user->update(['avatar' => $avatar]);
            }
        }

        // Mark email as verified if coming from a verified Google account
        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        RateLimiter::clear($throttleKey);

        return response()->json([
            'redirect' => route('dashboard', absolute: false),
        ]);
    }

    /**
     * Link Google account to the currently authenticated user.
     */
    public function linkAccount(Request $request): JsonResponse
    {
        $request->validate([
            'credential' => ['required', 'string', 'max:4096'],
        ]);

        $googleUser = $this->verifyGoogleToken($request->credential);

        if (!$googleUser) {
            return response()->json([
                'message' => 'Token do Google inválido ou expirado.',
            ], 422);
        }

        $googleId = $googleUser['sub'];

        // Ensure this Google account isn't linked to another user
        $existingUser = User::where('google_id', $googleId)->first();
        if ($existingUser && $existingUser->id !== $request->user()->id) {
            return response()->json([
                'message' => 'Esta conta do Google já está vinculada a outro usuário.',
            ], 409);
        }

        $request->user()->update([
            'google_id' => $googleId,
            'avatar' => $googleUser['picture'] ?? $request->user()->avatar,
        ]);

        return response()->json([
            'message' => 'Conta do Google vinculada com sucesso!',
            'avatar' => $request->user()->avatar,
            'google_linked' => true,
        ]);
    }

    /**
     * Unlink Google account from the currently authenticated user.
     */
    public function unlinkAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->hasPasswordSet()) {
            return response()->json([
                'message' => 'Defina uma senha antes de desvincular o Google, para não perder acesso à sua conta.',
            ], 422);
        }

        $user->update([
            'google_id' => null,
        ]);

        return response()->json([
            'message' => 'Conta do Google desvinculada.',
            'google_linked' => false,
        ]);
    }

    /**
     * Verify a Google ID token using the Google API Client library.
     * Returns the token payload or null on failure.
     */
    private function verifyGoogleToken(string $credential): ?array
    {
        try {
            $client = new Google_Client([
                'client_id' => config('services.google.client_id'),
            ]);

            $payload = $client->verifyIdToken($credential);

            if (!$payload) {
                return null;
            }

            // Validate audience matches our client ID
            $expectedClientId = config('services.google.client_id');
            if (($payload['aud'] ?? '') !== $expectedClientId) {
                return null;
            }

            return $payload;
        } catch (\Exception $e) {
            report($e);
            return null;
        }
    }
}

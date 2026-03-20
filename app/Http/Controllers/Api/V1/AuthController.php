<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Google\Client as GoogleClient;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $key = 'register:' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 10)) {
            return $this->error('Muitas tentativas. Tente novamente mais tarde.', 429);
        }

        RateLimiter::hit($key, 60);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'phone' => 'nullable|string|max:20|regex:/^[\d\s\(\)\-\+]+$/',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => trim($request->name),
            'email' => strtolower(trim($request->email)),
            'phone' => $request->phone ? trim($request->phone) : null,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        $token = $user->createToken('mobile-app')->plainTextToken;

        return $this->success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'theme' => $user->theme,
                'is_verified' => $user->hasVerifiedEmail(),
            ],
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $key = 'login:' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return $this->error("Muitas tentativas. Tente novamente em {$seconds} segundos.", 429);
        }

        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages([
                'email' => ['Credenciais inválidas.'],
            ]);
        }

        RateLimiter::clear($key);

        $user = Auth::user();
        $user->tokens()->where('name', 'mobile-app')->delete();
        $token = $user->createToken('mobile-app')->plainTextToken;

        return $this->success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'theme' => $user->theme,
                'is_verified' => $user->hasVerifiedEmail(),
            ],
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(['message' => 'Logout realizado com sucesso.']);
    }

    public function user(Request $request): JsonResponse
    {
        $user = $request->user();

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'theme' => $user->theme,
            'is_verified' => $user->hasVerifiedEmail(),
            'created_at' => $user->created_at,
        ]);
    }

    public function refreshToken(Request $request): JsonResponse
    {
        $user = $request->user();
        $request->user()->currentAccessToken()->delete();
        $token = $user->createToken('mobile-app')->plainTextToken;

        return $this->success(['token' => $token]);
    }

    public function googleLogin(Request $request): JsonResponse
    {
        $request->validate([
            'id_token' => ['required', 'string', 'max:4096'],
        ]);

        $key = 'google-login:' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 10)) {
            return $this->error('Muitas tentativas. Tente novamente mais tarde.', 429);
        }

        RateLimiter::hit($key, 60);

        $payload = $this->verifyGoogleIdToken($request->id_token);

        if (!$payload) {
            return $this->error('Token do Google inválido ou expirado.', 422);
        }

        $googleId = $payload['sub'];
        $email = strtolower(trim($payload['email']));
        $name = $payload['name'] ?? 'Usuário';
        $avatar = $payload['picture'] ?? null;

        if (empty($payload['email_verified'])) {
            return $this->error('Seu e-mail do Google não está verificado.', 422);
        }

        $user = User::where('google_id', $googleId)->first();

        if (!$user) {
            $user = User::where('email', $email)->first();

            if ($user) {
                $user->update([
                    'google_id' => $googleId,
                    'avatar' => $avatar ?: $user->avatar,
                ]);
            } else {
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
            if ($avatar && $avatar !== $user->avatar) {
                $user->update(['avatar' => $avatar]);
            }
        }

        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        $user->tokens()->where('name', 'mobile-app')->delete();
        $token = $user->createToken('mobile-app')->plainTextToken;

        RateLimiter::clear($key);

        return $this->success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'theme' => $user->theme,
                'is_verified' => $user->hasVerifiedEmail(),
                'avatar' => $user->avatar,
                'google_id' => $user->google_id,
            ],
            'token' => $token,
        ]);
    }

    private function verifyGoogleIdToken(string $idToken): ?array
    {
        try {
            $client = new GoogleClient([
                'client_id' => config('services.google.client_id'),
            ]);

            $payload = $client->verifyIdToken($idToken);

            if (!$payload) {
                return null;
            }

            if (($payload['aud'] ?? '') !== config('services.google.client_id')) {
                return null;
            }

            return $payload;
        } catch (\Exception $e) {
            report($e);
            return null;
        }
    }
}

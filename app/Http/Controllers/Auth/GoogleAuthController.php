<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\GoogleAccountLinker;
use App\Services\Auth\GoogleLinkConflictException;
use App\Services\Auth\GoogleTokenVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    public function __construct(
        private readonly GoogleTokenVerifier $verifier,
        private readonly GoogleAccountLinker $linker,
    ) {}

    public function nonce(Request $request): JsonResponse
    {
        $nonce = Str::random(40);
        $request->session()->put('google_nonce', $nonce);

        return response()->json(['nonce' => $nonce]);
    }

    public function handleToken(Request $request): JsonResponse
    {
        $request->validate([
            'credential' => ['required', 'string', 'max:4096'],
        ]);

        $throttleKey = 'google-auth:'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 10)) {
            return response()->json([
                'message' => 'Muitas tentativas. Tente novamente em alguns minutos.',
            ], 429);
        }

        RateLimiter::hit($throttleKey, 60);

        $googleUser = $this->verifier->verify($request->credential);

        if (! $googleUser) {
            return response()->json([
                'message' => 'Token do Google inválido ou expirado. Tente novamente.',
            ], 422);
        }

        if (! $this->nonceIsValid($request, $googleUser)) {
            return response()->json([
                'message' => 'Sessão de login expirada. Recarregue a página e tente novamente.',
            ], 422);
        }

        if (empty($googleUser['email_verified'])) {
            return response()->json([
                'message' => 'Seu e-mail do Google não está verificado.',
            ], 422);
        }

        try {
            $user = $this->linker->resolve($googleUser);
        } catch (GoogleLinkConflictException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        RateLimiter::clear($throttleKey);

        return response()->json([
            'redirect' => route('dashboard', absolute: false),
        ]);
    }

    public function linkAccount(Request $request): JsonResponse
    {
        $request->validate([
            'credential' => ['required', 'string', 'max:4096'],
        ]);

        $googleUser = $this->verifier->verify($request->credential);

        if (! $googleUser) {
            return response()->json([
                'message' => 'Token do Google inválido ou expirado.',
            ], 422);
        }

        if (! $this->nonceIsValid($request, $googleUser)) {
            return response()->json([
                'message' => 'Sessão expirada. Recarregue a página e tente novamente.',
            ], 422);
        }

        $googleId = $googleUser['sub'];

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

    public function unlinkAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasPasswordSet()) {
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
     * Nonce do OpenID Connect: emitido por nonce(), guardado na sessão e de uso
     * único. O id_token só vale se trouxer exatamente esse valor.
     */
    private function nonceIsValid(Request $request, array $googleUser): bool
    {
        $expected = $request->session()->pull('google_nonce');
        $received = $googleUser['nonce'] ?? null;

        return is_string($expected) && $expected !== ''
            && is_string($received)
            && hash_equals($expected, $received);
    }
}

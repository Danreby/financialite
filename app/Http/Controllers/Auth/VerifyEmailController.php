<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VerifyEmailController extends Controller
{
    /**
     * Mark the user's email address as verified.
     * Allows verification even if user is not logged in.
     */
    public function __invoke(Request $request, int $id, string $hash): RedirectResponse
    {
        $user = User::findOrFail($id);

        // Verificar se o hash corresponde ao email do usuário
        if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return redirect()->route('login')->with('error', 'Link de verificação inválido.');
        }

        // Verificar se a URL é assinada corretamente
        if (!$request->hasValidSignature()) {
            return redirect()->route('login')->with('error', 'Link de verificação expirado. Por favor, solicite um novo.');
        }

        // Se já está verificado
        if ($user->hasVerifiedEmail()) {
            // Se não está logado, redireciona para login
            if (!Auth::check()) {
                return redirect()->route('login')->with('status', 'Email já verificado! Faça login para continuar.');
            }
            return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
        }

        // Marcar como verificado
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        // Se não está logado, fazer login automaticamente
        if (!Auth::check()) {
            Auth::login($user);
        }

        return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
    }
}

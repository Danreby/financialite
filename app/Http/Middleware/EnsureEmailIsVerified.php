<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Middleware\EnsureEmailIsVerified as BaseMiddleware;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Symfony\Component\HttpFoundation\Response;

/**
 * Igual ao middleware `verified` do Laravel, mas responde em pt-BR para
 * clientes JSON (API mobile).
 */
class EnsureEmailIsVerified extends BaseMiddleware
{
    public function handle($request, Closure $next, $redirectToRoute = null): Response
    {
        $user = $request->user();

        if (
            $request->expectsJson()
            && $user instanceof MustVerifyEmail
            && ! $user->hasVerifiedEmail()
        ) {
            return response()->json(['message' => 'Confirme seu e-mail para continuar.'], 403);
        }

        return parent::handle($request, $next, $redirectToRoute);
    }
}

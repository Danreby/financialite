<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CacheApiResponse
{
    /**
     * Dados financeiros nunca ficam em cache de navegador ou proxy. O parâmetro
     * $maxAge segue aceito só para manter compatível o alias `cache.api:N`.
     */
    public function handle(Request $request, Closure $next, int $maxAge = 0): Response
    {
        $response = $next($request);

        if (
            $request->isMethod('GET') &&
            $response->isSuccessful() &&
            $request->wantsJson()
        ) {
            $response->headers->set('Cache-Control', 'private, no-store');
            $response->headers->set('Vary', 'Accept, Authorization');
        }

        return $response;
    }
}

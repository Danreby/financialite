<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CacheApiResponse
{
    private const DEFAULT_MAX_AGE = 15;

    public function handle(Request $request, Closure $next, int $maxAge = self::DEFAULT_MAX_AGE): Response
    {
        $response = $next($request);

        if (
            $request->isMethod('GET') &&
            $response->isSuccessful() &&
            $request->wantsJson()
        ) {
            $response->headers->set('Cache-Control', "private, max-age={$maxAge}, stale-while-revalidate=5");
            $response->headers->set('Vary', 'Accept, Authorization');
        }

        return $response;
    }
}

<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\SanitizeInput::class,
            \App\Http\Middleware\DetectSuspiciousActivity::class,
            \App\Http\Middleware\LogSecurityEvents::class,
        ]);

        $middleware->api(append: [
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\SanitizeInput::class,
            \App\Http\Middleware\DetectSuspiciousActivity::class,
            \App\Http\Middleware\LogSecurityEvents::class,
        ]);

        $middleware->alias([
            'action.limit' => \App\Http\Middleware\ActionRateLimiter::class,
            'cache.api' => \App\Http\Middleware\CacheApiResponse::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Return JSON errors for all API requests so the mobile app can display them
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if (!$request->expectsJson() && !$request->is('api/*')) {
                return null;
            }

            // Let Laravel handle ValidationException natively (returns 422 with field errors)
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                return null;
            }

            // Let Laravel handle AuthenticationException natively (returns 401)
            if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                return null;
            }

            // Determine proper HTTP status code
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                $status = $e->getStatusCode();
            } elseif (property_exists($e, 'status')) {
                $status = $e->status;
            } else {
                $status = 500;
            }

            $isDebug = config('app.debug', false);

            $body = [
                'message' => $status >= 500
                    ? 'Erro interno do servidor. Contate o suporte.'
                    : $e->getMessage(),
                'error' => class_basename($e) . ': ' . $e->getMessage(),
            ];

            if ($isDebug) {
                $body['exception'] = get_class($e);
                $body['file'] = $e->getFile();
                $body['line'] = $e->getLine();
            }

            return response()->json($body, $status ?: 500);
        });
    })->create();

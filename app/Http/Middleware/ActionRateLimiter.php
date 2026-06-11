<?php

namespace App\Http\Middleware;

use App\Security\Contracts\SecurityLoggerInterface;
use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ActionRateLimiter
{
    public function __construct(
        protected RateLimiter $limiter,
        protected SecurityLoggerInterface $logger
    ) {}

    public function handle(
        Request $request,
        Closure $next,
        string $action = 'default',
        int $maxAttempts = 60,
        int $decayMinutes = 1
    ): Response {
        $key = $this->resolveRequestKey($request, $action);

        if ($this->limiter->tooManyAttempts($key, $maxAttempts)) {
            $this->logger->logRateLimitExceeded($key, $action, [
                'max_attempts' => $maxAttempts,
                'decay_minutes' => $decayMinutes,
            ]);

            return $this->buildRateLimitResponse($key, $maxAttempts);
        }

        $this->limiter->hit($key, $decayMinutes * 60);

        $response = $next($request);

        return $this->addRateLimitHeaders(
            $response,
            $maxAttempts,
            $this->calculateRemainingAttempts($key, $maxAttempts)
        );
    }

    protected function resolveRequestKey(Request $request, string $action): string
    {
        $userId = $request->user()?->id ?? 'guest';
        $ip = $request->ip();

        return "rate_limit:{$action}:{$userId}:{$ip}";
    }

    protected function buildRateLimitResponse(string $key, int $maxAttempts): Response
    {
        $retryAfter = $this->limiter->availableIn($key);

        return response()->json([
            'message' => 'Muitas requisições. Tente novamente mais tarde.',
            'retry_after' => $retryAfter,
        ], 429)->withHeaders([
            'Retry-After' => $retryAfter,
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => 0,
        ]);
    }

    protected function addRateLimitHeaders(
        Response $response,
        int $maxAttempts,
        int $remainingAttempts
    ): Response {
        $response->headers->set('X-RateLimit-Limit', (string) $maxAttempts);
        $response->headers->set('X-RateLimit-Remaining', (string) max(0, $remainingAttempts));

        return $response;
    }

    protected function calculateRemainingAttempts(string $key, int $maxAttempts): int
    {
        return $this->limiter->remaining($key, $maxAttempts);
    }
}

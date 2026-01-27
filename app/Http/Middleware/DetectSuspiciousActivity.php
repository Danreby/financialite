<?php

namespace App\Http\Middleware;

use App\Security\Contracts\SecurityLoggerInterface;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DetectSuspiciousActivity
{

    protected array $sqlPatterns = [
        '/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b.*\b(FROM|INTO|TABLE|SET|WHERE)\b)/i',
        '/[\'\"];\s*(DROP|DELETE|UPDATE|INSERT)/i',
        '/\bOR\b\s*[\'\"]?\s*1\s*=\s*1/i',
        '/\bAND\b\s*[\'\"]?\s*1\s*=\s*1/i',
        '/--\s*$/m',
    ];

    protected array $xssPatterns = [
        '/<script\b[^>]*>/i',
        '/javascript\s*:/i',
        '/on\w+\s*=/i',
        '/<iframe/i',
        '/<object/i',
        '/<embed/i',
    ];

    protected array $pathTraversalPatterns = [
        '/\.\.\//',
        '/\.\.\\\\/',
        '/%2e%2e%2f/i',
        '/%2e%2e\//i',
        '/\.%2e\//i',
    ];

    public function __construct(protected SecurityLoggerInterface $logger)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $input = $this->getAllInput($request);

        foreach ($input as $key => $value) {
            if (!is_string($value)) {
                continue;
            }

            if ($this->matchesPatterns($value, $this->sqlPatterns)) {
                $this->logger->logSqlInjectionAttempt($value, [
                    'field' => $key,
                    'route' => $request->route()?->getName(),
                ]);
            }

            if ($this->matchesPatterns($value, $this->xssPatterns)) {
                $this->logger->logXssAttempt($value, [
                    'field' => $key,
                    'route' => $request->route()?->getName(),
                ]);
            }

            if ($this->matchesPatterns($value, $this->pathTraversalPatterns)) {
                $this->logger->logSuspicious('Path traversal attempt detected', [
                    'field' => $key,
                    'route' => $request->route()?->getName(),
                ]);
            }
        }

        return $next($request);
    }

    protected function getAllInput(Request $request): array
    {
        $input = $request->all();
        $query = $request->query();

        if (is_array($query)) {
            $input = array_merge($query, $input);
        }

        return $this->flattenArray($input);
    }

    protected function flattenArray(array $array, string $prefix = ''): array
    {
        $result = [];

        foreach ($array as $key => $value) {
            $newKey = $prefix ? "{$prefix}.{$key}" : $key;

            if (is_array($value)) {
                $result = array_merge($result, $this->flattenArray($value, $newKey));
            } else {
                $result[$newKey] = $value;
            }
        }

        return $result;
    }

    protected function matchesPatterns(string $value, array $patterns): bool
    {
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }

        return false;
    }
}

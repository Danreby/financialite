<?php

namespace App\Http\Middleware;

use App\Security\Contracts\SecurityLoggerInterface;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DetectSuspiciousActivity
{
    protected bool $blockSuspiciousRequests;

    protected bool $blockOnlyCritical;

    protected array $sqlPatterns = [
        '/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b.*\b(FROM|INTO|TABLE|SET|WHERE)\b)/i',
        '/[\'\"];\s*(DROP|DELETE|UPDATE|INSERT)/i',
        '/\bOR\b\s*[\'\"]?\s*1\s*=\s*1/i',
        '/\bAND\b\s*[\'\"]?\s*1\s*=\s*1/i',
        '/--\s*$/m',
        '/\/\*.*\*\//s',
        '/\bEXEC\s*\(/i',
        '/\bXP_/i',
        '/\bWAITFOR\s+DELAY/i',
        '/\bBENCHMARK\s*\(/i',
        '/\bSLEEP\s*\(/i',
        '/;\s*SHUTDOWN/i',
        '/LOAD_FILE\s*\(/i',
        '/INTO\s+(OUT|DUMP)FILE/i',
    ];

    protected array $xssPatterns = [
        '/<script\b[^>]*>/i',
        '/javascript\s*:/i',
        '/on\w+\s*=/i',
        '/<iframe/i',
        '/<object/i',
        '/<embed/i',
        '/data\s*:\s*text\/html/i',
        '/vbscript\s*:/i',
        '/expression\s*\(/i',
        '/<svg[^>]*onload/i',
        '/<img[^>]*onerror/i',
        '/<body[^>]*onload/i',
    ];

    protected array $pathTraversalPatterns = [
        '/\.\.\//',
        '/\.\.\\\\/',
        '/%2e%2e%2f/i',
        '/%2e%2e\//i',
        '/\.%2e\//i',
        '/%252e/i',
        '/\.\.\%00/i',
        '/etc\/passwd/i',
        '/boot\.ini/i',
        '/win\.ini/i',
    ];

    public function __construct(protected SecurityLoggerInterface $logger)
    {
        $this->blockSuspiciousRequests = config('security.suspicious_activity.block_requests', true);
        $this->blockOnlyCritical = config('security.suspicious_activity.block_only_critical', false);
    }

    public function handle(Request $request, Closure $next): Response
    {
        $input = $this->getAllInput($request);
        $threats = [];

        foreach ($input as $key => $value) {
            if (! is_string($value)) {
                continue;
            }

            if ($this->matchesPatterns($value, $this->sqlPatterns)) {
                $this->logger->logSqlInjectionAttempt($value, [
                    'field' => $key,
                    'route' => $request->route()?->getName(),
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
                $threats[] = ['type' => 'sql_injection', 'field' => $key, 'critical' => true];
            }

            if ($this->matchesPatterns($value, $this->xssPatterns)) {
                $this->logger->logXssAttempt($value, [
                    'field' => $key,
                    'route' => $request->route()?->getName(),
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
                $threats[] = ['type' => 'xss', 'field' => $key, 'critical' => false];
            }

            if ($this->matchesPatterns($value, $this->pathTraversalPatterns)) {
                $this->logger->logSuspicious('Path traversal attempt detected', [
                    'field' => $key,
                    'route' => $request->route()?->getName(),
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
                $threats[] = ['type' => 'path_traversal', 'field' => $key, 'critical' => true];
            }
        }

        if (! empty($threats) && $this->shouldBlock($threats)) {
            return $this->blockRequest($request, $threats);
        }

        return $next($request);
    }

    protected function shouldBlock(array $threats): bool
    {
        if (! $this->blockSuspiciousRequests) {
            return false;
        }

        if ($this->blockOnlyCritical) {
            return collect($threats)->contains('critical', true);
        }

        return true;
    }

    protected function blockRequest(Request $request, array $threats): Response
    {
        $threatTypes = collect($threats)->pluck('type')->unique()->implode(', ');

        $this->logger->logSuspicious('Request blocked due to detected threats', [
            'threats' => $threatTypes,
            'route' => $request->route()?->getName(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Requisição bloqueada: entrada inválida detectada.',
                'error' => 'invalid_input',
            ], 400);
        }

        abort(400, 'Requisição bloqueada: entrada inválida detectada.');
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

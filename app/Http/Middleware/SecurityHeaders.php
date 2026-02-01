<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    protected ?string $nonce = null;

    public function handle(Request $request, Closure $next): Response
    {
        $this->nonce = $this->generateNonce();
        
        view()->share('cspNonce', $this->nonce);

        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-origin');
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none');
        $response->headers->set('X-DNS-Prefetch-Control', 'off');
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        if (config('security.csp.enabled', false)) {
            $this->applyContentSecurityPolicy($response);
        }

        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        return $response;
    }

    protected function applyContentSecurityPolicy(Response $response): void
    {
        $cspHeader = $this->buildCspHeader();
        
        if (empty($cspHeader)) {
            return;
        }

        $headerName = config('security.csp.report_only', false)
            ? 'Content-Security-Policy-Report-Only'
            : 'Content-Security-Policy';

        $response->headers->set($headerName, $cspHeader);
    }

    protected function buildCspHeader(): string
    {
        $directives = config('security.csp.directives', []);
        
        if (empty($directives)) {
            return $this->getDefaultCspHeader();
        }

        $parts = [];

        foreach ($directives as $directive => $values) {
            if (empty($values)) {
                continue;
            }

            $values = array_map(function ($value) {
                if ($value === "'nonce'") {
                    return "'nonce-{$this->nonce}'";
                }
                return $value;
            }, $values);

            $parts[] = $directive . ' ' . implode(' ', $values);
        }

        $reportUri = config('security.csp.report_uri');
        if ($reportUri) {
            $parts[] = "report-uri {$reportUri}";
        }

        return implode('; ', $parts);
    }

    protected function getDefaultCspHeader(): string
    {
        return implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'nonce-{$this->nonce}'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]);
    }

    protected function generateNonce(): string
    {
        return base64_encode(random_bytes(16));
    }

    public function getNonce(): ?string
    {
        return $this->nonce;
    }
}

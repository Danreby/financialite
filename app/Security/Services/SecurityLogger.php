<?php

namespace App\Security\Services;

use App\Security\Contracts\SecurityLoggerInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;

class SecurityLogger implements SecurityLoggerInterface
{
    protected string $channel = 'security';

    public function logAuth(string $event, ?int $userId = null, array $context = []): void
    {
        $context = $this->enrichContext($context, $userId);
        
        $level = $this->getAuthEventLevel($event);
        
        Log::channel($this->channel)->log($level, "Auth event: {$event}", $context);
    }

    public function logAuthorizationFailure(string $action, string $resource, ?int $userId = null, array $context = []): void
    {
        $context = array_merge($context, [
            'action' => $action,
            'resource' => $resource,
        ]);
        
        $context = $this->enrichContext($context, $userId);
        
        Log::channel($this->channel)->warning("Authorization denied: {$action} on {$resource}", $context);
    }

    public function logSuspicious(string $activity, array $context = []): void
    {
        $context = $this->enrichContext($context);
        $context['alert_type'] = 'suspicious_activity';
        
        Log::channel($this->channel)->warning("Suspicious activity: {$activity}", $context);
    }

    public function logRateLimitExceeded(string $identifier, string $action, array $context = []): void
    {
        $context = array_merge($context, [
            'identifier' => $this->hashIdentifier($identifier),
            'action' => $action,
        ]);
        
        $context = $this->enrichContext($context);
        
        Log::channel($this->channel)->warning("Rate limit exceeded for action: {$action}", $context);
    }

    public function logDataAccess(string $action, string $resource, ?int $userId = null, array $context = []): void
    {
        $context = array_merge($context, [
            'data_action' => $action,
            'resource' => $resource,
        ]);
        
        $context = $this->enrichContext($context, $userId);
        
        Log::channel($this->channel)->info("Data access: {$action} on {$resource}", $context);
    }

    public function logValidationFailure(string $source, array $errors, array $context = []): void
    {
        $context = array_merge($context, [
            'source' => $source,
            'errors' => $this->sanitizeErrors($errors),
        ]);
        
        $context = $this->enrichContext($context);
        
        Log::channel($this->channel)->notice("Validation failure in {$source}", $context);
    }

    public function logSecurityException(\Throwable $exception, array $context = []): void
    {
        $context = array_merge($context, [
            'exception_class' => get_class($exception),
            'exception_message' => $exception->getMessage(),
            'exception_code' => $exception->getCode(),
            'exception_file' => $exception->getFile(),
            'exception_line' => $exception->getLine(),
        ]);
        
        $context = $this->enrichContext($context);
        
        Log::channel($this->channel)->error("Security exception: " . get_class($exception), $context);
    }

    public function logCsrfMismatch(array $context = []): void
    {
        $context = $this->enrichContext($context);
        $context['alert_type'] = 'csrf_mismatch';
        
        Log::channel($this->channel)->warning("CSRF token mismatch detected", $context);
    }

    public function logSqlInjectionAttempt(string $input, array $context = []): void
    {
        $context = $this->enrichContext($context);
        $context['alert_type'] = 'sql_injection_attempt';
        $context['suspicious_input_hash'] = hash('sha256', $input);
        
        Log::channel($this->channel)->error("Potential SQL injection attempt detected", $context);
    }

    public function logXssAttempt(string $input, array $context = []): void
    {
        $context = $this->enrichContext($context);
        $context['alert_type'] = 'xss_attempt';
        $context['suspicious_input_hash'] = hash('sha256', $input);
        
        Log::channel($this->channel)->error("Potential XSS attempt detected", $context);
    }

    protected function enrichContext(array $context, ?int $userId = null): array
    {
        $request = Request::instance();
        
        $resolvedUserId = $userId;
        if ($resolvedUserId === null && Auth::check()) {
            $user = Auth::user();
            $resolvedUserId = $user?->id;
        }
        
        return array_merge([
            'timestamp' => now()->toIso8601String(),
            'ip_address' => $this->hashIp($request->ip()),
            'user_agent_hash' => hash('sha256', $request->userAgent() ?? ''),
            'request_method' => $request->method(),
            'request_path' => $request->path(),
            'user_id' => $resolvedUserId,
            'session_id_hash' => $request->hasSession() ? hash('sha256', $request->session()->getId()) : null,
        ], $context);
    }

    protected function hashIp(?string $ip): ?string
    {
        if (!$ip) {
            return null;
        }
        
        if (config('app.env') === 'production') {
            return hash('sha256', $ip . config('app.key'));
        }
        
        return $ip;
    }

    protected function hashIdentifier(string $identifier): string
    {
        return hash('sha256', $identifier . config('app.key'));
    }

    protected function sanitizeErrors(array $errors): array
    {
        $sanitized = [];
        
        foreach ($errors as $field => $messages) {
            $sanitized[$field] = is_array($messages) ? count($messages) . ' error(s)' : 'error';
        }
        
        return $sanitized;
    }

    protected function getAuthEventLevel(string $event): string
    {
        return match($event) {
            'failed_login', 'lockout', 'password_reset_failed' => 'warning',
            'suspicious_login', 'brute_force_detected' => 'error',
            'login', 'logout', 'password_reset' => 'info',
            default => 'info',
        };
    }
}

<?php

namespace App\Security\Contracts;

/**
 * Interface for security event logging.
 * 
 * Provides a contract for logging security-related events
 * for auditing and monitoring purposes.
 */
interface SecurityLoggerInterface
{
    /**
     * Log an authentication event.
     *
     * @param string $event The event type (login, logout, failed_login, etc.)
     * @param int|null $userId The user ID if available
     * @param array $context Additional context data
     * @return void
     */
    public function logAuth(string $event, ?int $userId = null, array $context = []): void;

    /**
     * Log an authorization failure event.
     *
     * @param string $action The action that was denied
     * @param string $resource The resource being accessed
     * @param int|null $userId The user ID if available
     * @param array $context Additional context data
     * @return void
     */
    public function logAuthorizationFailure(string $action, string $resource, ?int $userId = null, array $context = []): void;

    /**
     * Log a suspicious activity event.
     *
     * @param string $activity Description of the suspicious activity
     * @param array $context Additional context data
     * @return void
     */
    public function logSuspicious(string $activity, array $context = []): void;

    /**
     * Log a rate limit exceeded event.
     *
     * @param string $identifier The identifier that exceeded the limit
     * @param string $action The action being rate limited
     * @param array $context Additional context data
     * @return void
     */
    public function logRateLimitExceeded(string $identifier, string $action, array $context = []): void;

    /**
     * Log a data access event for sensitive operations.
     *
     * @param string $action The action performed (read, write, delete)
     * @param string $resource The resource being accessed
     * @param int|null $userId The user ID
     * @param array $context Additional context data
     * @return void
     */
    public function logDataAccess(string $action, string $resource, ?int $userId = null, array $context = []): void;

    /**
     * Log a validation failure event.
     *
     * @param string $source The source of the validation failure
     * @param array $errors The validation errors
     * @param array $context Additional context data
     * @return void
     */
    public function logValidationFailure(string $source, array $errors, array $context = []): void;

    /**
     * Log a SQL injection attempt.
     *
     * @param string $value The malicious value detected
     * @param array $context Additional context data
     * @return void
     */
    public function logSqlInjectionAttempt(string $value, array $context = []): void;

    /**
     * Log an XSS (Cross-Site Scripting) attempt.
     *
     * @param string $value The malicious value detected
     * @param array $context Additional context data
     * @return void
     */
    public function logXssAttempt(string $value, array $context = []): void;
}

<?php

namespace App\Security\Contracts;

interface SecurityLoggerInterface
{
    public function logAuth(string $event, ?int $userId = null, array $context = []): void;

    public function logAuthorizationFailure(string $action, string $resource, ?int $userId = null, array $context = []): void;

    public function logSuspicious(string $activity, array $context = []): void;

    public function logRateLimitExceeded(string $identifier, string $action, array $context = []): void;

    public function logDataAccess(string $action, string $resource, ?int $userId = null, array $context = []): void;

    public function logValidationFailure(string $source, array $errors, array $context = []): void;

    public function logSqlInjectionAttempt(string $value, array $context = []): void;

    public function logXssAttempt(string $value, array $context = []): void;
}

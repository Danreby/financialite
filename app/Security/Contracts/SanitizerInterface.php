<?php

namespace App\Security\Contracts;

/**
 * Interface for data sanitization implementations.
 * 
 * Provides a contract for sanitizing user input to prevent XSS attacks
 * and other injection vulnerabilities.
 */
interface SanitizerInterface
{
    /**
     * Sanitize a single value.
     *
     * @param mixed $value The value to sanitize
     * @return mixed The sanitized value
     */
    public function sanitize(mixed $value): mixed;

    /**
     * Sanitize an array of values recursively.
     *
     * @param array $data The data array to sanitize
     * @param array $except Keys to exclude from sanitization
     * @return array The sanitized data array
     */
    public function sanitizeArray(array $data, array $except = []): array;

    /**
     * Sanitize a string value.
     *
     * @param string $value The string to sanitize
     * @return string The sanitized string
     */
    public function sanitizeString(string $value): string;
}

<?php

namespace App\Security\Services;

use App\Security\Contracts\SanitizerInterface;

/**
 * Input sanitization service.
 * 
 * Provides comprehensive sanitization for user input to prevent
 * XSS attacks and other injection vulnerabilities.
 */
class InputSanitizer implements SanitizerInterface
{
    protected array $globalExcept = [
        'password',
        'password_confirmation',
        'current_password',
        'email',
    ];

    /**
     * {@inheritdoc}
     */
    public function sanitize(mixed $value): mixed
    {
        if (is_null($value)) {
            return null;
        }

        if (is_string($value)) {
            return $this->sanitizeString($value);
        }

        if (is_array($value)) {
            return $this->sanitizeArray($value);
        }

        if (is_numeric($value)) {
            return $value;
        }

        if (is_bool($value)) {
            return $value;
        }

        return $value;
    }

    /**
     * {@inheritdoc}
     */
    public function sanitizeArray(array $data, array $except = []): array
    {
        $except = array_merge($this->globalExcept, $except);

        $sanitized = [];

        foreach ($data as $key => $value) {
            if (in_array($key, $except, true)) {
                $sanitized[$key] = $value;
                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeArray($value, $except);
            } else {
                $sanitized[$key] = $this->sanitize($value);
            }
        }

        return $sanitized;
    }

    /**
     * {@inheritdoc}
     */
    public function sanitizeString(string $value): string
    {
        // Remove null bytes
        $value = str_replace(chr(0), '', $value);

        // Convert special characters to HTML entities
        $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);

        // Trim whitespace
        $value = trim($value);

        return $value;
    }

    /**
     * Sanitize string for database storage (minimal sanitization).
     * Use this when data will be escaped by the database driver.
     *
     * @param string $value The string to sanitize
     * @return string The sanitized string
     */
    public function sanitizeForDatabase(string $value): string
    {
        // Remove null bytes only - DB driver handles escaping
        return str_replace(chr(0), '', trim($value));
    }

    /**
     * Sanitize a filename for safe storage.
     *
     * @param string $filename The filename to sanitize
     * @return string The sanitized filename
     */
    public function sanitizeFilename(string $filename): string
    {
        // Remove directory traversal attempts
        $filename = basename($filename);

        // Remove null bytes
        $filename = str_replace(chr(0), '', $filename);

        // Replace potentially dangerous characters
        $filename = preg_replace('/[^\w\-\.\s]/', '_', $filename);

        // Remove multiple consecutive underscores/dots
        $filename = preg_replace('/[_\.]{2,}/', '_', $filename);

        // Ensure the filename doesn't start with a dot (hidden files)
        $filename = ltrim($filename, '.');

        return $filename ?: 'unnamed';
    }

    /**
     * Sanitize a URL for safe usage.
     *
     * @param string $url The URL to sanitize
     * @return string|null The sanitized URL or null if invalid
     */
    public function sanitizeUrl(string $url): ?string
    {
        $url = filter_var(trim($url), FILTER_SANITIZE_URL);

        if (!$url) {
            return null;
        }

        // Only allow http and https protocols
        if (!preg_match('/^https?:\/\//i', $url)) {
            return null;
        }

        // Validate the URL
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }

        return $url;
    }

    /**
     * Strip all HTML tags from a string.
     *
     * @param string $value The string to strip
     * @return string The stripped string
     */
    public function stripTags(string $value): string
    {
        return strip_tags($value);
    }

    /**
     * Decode HTML entities then sanitize.
     * Use when input might already contain encoded entities.
     *
     * @param string $value The value to decode and sanitize
     * @return string The sanitized string
     */
    public function decodeAndSanitize(string $value): string
    {
        $decoded = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return $this->sanitizeString($decoded);
    }
}

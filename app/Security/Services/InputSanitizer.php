<?php

namespace App\Security\Services;

use App\Security\Contracts\SanitizerInterface;

class InputSanitizer implements SanitizerInterface
{
    protected array $globalExcept = [
        'password',
        'password_confirmation',
        'current_password',
        'email',
    ];

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
     * Strips null bytes/control characters and trims. Does NOT HTML-encode
     * by default: encoding on the way in silently corrupts stored data
     * (e.g. "O'Brien" -> "O&#039;Brien" permanently) and is redundant with
     * Eloquent's parameterized queries (SQLi) and the React/Blade layer's
     * auto-escaping on output (XSS) — the correct place to encode for
     * display. Set security.sanitization.html_encode to opt back in for a
     * specific field/use case if you know you need it.
     */
    public function sanitizeString(string $value): string
    {
        $value = $this->stripControlChars($value);

        if (config('security.sanitization.strip_tags', false)) {
            $value = strip_tags($value);
        }

        if (config('security.sanitization.html_encode', false)) {
            $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8', false);
        }

        return trim($value);
    }

    protected function stripControlChars(string $value): string
    {
        return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value) ?? $value;
    }

    public function sanitizeForDatabase(string $value): string
    {
        return str_replace(chr(0), '', trim($value));
    }

    public function sanitizeFilename(string $filename): string
    {
        $filename = basename($filename);
        $filename = str_replace(chr(0), '', $filename);
        $filename = preg_replace('/[^\w\-\.\s]/', '_', $filename);
        $filename = preg_replace('/[_\.]{2,}/', '_', $filename);
        $filename = ltrim($filename, '.');

        return $filename ?: 'unnamed';
    }

    public function sanitizeUrl(string $url): ?string
    {
        $url = filter_var(trim($url), FILTER_SANITIZE_URL);

        if (! $url) {
            return null;
        }

        if (! preg_match('/^https?:\/\//i', $url)) {
            return null;
        }

        if (! filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }

        return $url;
    }

    public function stripTags(string $value): string
    {
        return strip_tags($value);
    }

    public function decodeAndSanitize(string $value): string
    {
        $decoded = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return $this->sanitizeString($decoded);
    }
}

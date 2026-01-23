<?php

namespace App\Security\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validation rule to detect potential XSS patterns.
 */
class NoXss implements ValidationRule
{
    /**
     * Common XSS patterns to detect.
     */
    protected array $patterns = [
        '/<script\b[^>]*>/i',
        '/<\/script>/i',
        '/javascript\s*:/i',
        '/vbscript\s*:/i',
        '/on\w+\s*=/i', // onclick, onerror, onload, etc.
        '/<iframe/i',
        '/<object/i',
        '/<embed/i',
        '/<applet/i',
        '/<form/i',
        '/<input[^>]+type\s*=\s*["\']?hidden/i',
        '/<meta[^>]+http-equiv/i',
        '/<link[^>]+rel\s*=\s*["\']?import/i',
        '/expression\s*\(/i', // CSS expression
        '/url\s*\(\s*["\']?\s*javascript/i',
        '/<svg[^>]*\s+on\w+\s*=/i',
        '/data\s*:\s*text\/html/i',
        '/&#x?\d+;?/i', // HTML entities that could be malicious
    ];

    /**
     * Whether to allow safe HTML tags.
     */
    protected bool $allowSafeHtml = false;

    /**
     * Create a new rule instance.
     *
     * @param bool $allowSafeHtml
     */
    public function __construct(bool $allowSafeHtml = false)
    {
        $this->allowSafeHtml = $allowSafeHtml;
    }

    /**
     * Run the validation rule.
     *
     * @param string $attribute
     * @param mixed $value
     * @param Closure $fail
     * @return void
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value)) {
            return;
        }

        // Check for XSS patterns
        foreach ($this->patterns as $pattern) {
            if (preg_match($pattern, $value)) {
                $fail('O campo :attribute contém caracteres potencialmente perigosos.');
                return;
            }
        }

        // If not allowing safe HTML, check for any HTML tags
        if (!$this->allowSafeHtml && $this->containsHtmlTags($value)) {
            $fail('O campo :attribute não pode conter tags HTML.');
            return;
        }
    }

    /**
     * Check if the value contains HTML tags.
     *
     * @param string $value
     * @return bool
     */
    protected function containsHtmlTags(string $value): bool
    {
        return $value !== strip_tags($value);
    }

    /**
     * Allow safe HTML tags.
     *
     * @return static
     */
    public static function allowingSafeHtml(): static
    {
        return new static(true);
    }
}

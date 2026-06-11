<?php

namespace App\Security\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class NoXss implements ValidationRule
{
    protected array $patterns = [
        '/<script\b[^>]*>/i',
        '/<\/script>/i',
        '/javascript\s*:/i',
        '/vbscript\s*:/i',
        '/on\w+\s*=/i',
        '/<iframe/i',
        '/<object/i',
        '/<embed/i',
        '/<applet/i',
        '/<form/i',
        '/<input[^>]+type\s*=\s*["\']?hidden/i',
        '/<meta[^>]+http-equiv/i',
        '/<link[^>]+rel\s*=\s*["\']?import/i',
        '/expression\s*\(/i',
        '/url\s*\(\s*["\']?\s*javascript/i',
        '/<svg[^>]*\s+on\w+\s*=/i',
        '/data\s*:\s*text\/html/i',
        '/&#x?\d+;?/i',
    ];

    protected bool $allowSafeHtml = false;

    public function __construct(bool $allowSafeHtml = false)
    {
        $this->allowSafeHtml = $allowSafeHtml;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            return;
        }

        foreach ($this->patterns as $pattern) {
            if (preg_match($pattern, $value)) {
                $fail('O campo :attribute contém caracteres potencialmente perigosos.');

                return;
            }
        }

        if (! $this->allowSafeHtml && $this->containsHtmlTags($value)) {
            $fail('O campo :attribute não pode conter tags HTML.');

            return;
        }
    }

    protected function containsHtmlTags(string $value): bool
    {
        return $value !== strip_tags($value);
    }

    public static function allowingSafeHtml(): static
    {
        return new static(true);
    }
}

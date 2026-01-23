<?php

namespace App\Security\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validation rule to ensure safe string content.
 * Combines multiple security checks into one rule.
 */
class SafeString implements ValidationRule
{
    /**
     * Maximum allowed string length.
     */
    protected int $maxLength;

    /**
     * Whether to allow Unicode characters.
     */
    protected bool $allowUnicode;

    /**
     * Additional forbidden patterns.
     */
    protected array $forbiddenPatterns = [];

    /**
     * Create a new rule instance.
     *
     * @param int $maxLength
     * @param bool $allowUnicode
     */
    public function __construct(int $maxLength = 255, bool $allowUnicode = true)
    {
        $this->maxLength = $maxLength;
        $this->allowUnicode = $allowUnicode;
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

        // Check length
        $length = $this->allowUnicode ? mb_strlen($value, 'UTF-8') : strlen($value);
        if ($length > $this->maxLength) {
            $fail("O campo :attribute não pode ter mais de {$this->maxLength} caracteres.");
            return;
        }

        // Check for null bytes
        if (str_contains($value, "\0")) {
            $fail('O campo :attribute contém caracteres inválidos.');
            return;
        }

        // Check for control characters (except newlines and tabs in some cases)
        if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) {
            $fail('O campo :attribute contém caracteres de controle inválidos.');
            return;
        }

        // Check forbidden patterns
        foreach ($this->forbiddenPatterns as $pattern) {
            if (preg_match($pattern, $value)) {
                $fail('O campo :attribute contém conteúdo não permitido.');
                return;
            }
        }

        // Run XSS check
        $xssRule = new NoXss();
        $xssRule->validate($attribute, $value, $fail);
    }

    /**
     * Add forbidden patterns.
     *
     * @param array $patterns
     * @return static
     */
    public function forbidPatterns(array $patterns): static
    {
        $this->forbiddenPatterns = array_merge($this->forbiddenPatterns, $patterns);
        return $this;
    }

    /**
     * Create a rule for short text fields.
     *
     * @return static
     */
    public static function short(): static
    {
        return new static(100);
    }

    /**
     * Create a rule for medium text fields.
     *
     * @return static
     */
    public static function medium(): static
    {
        return new static(500);
    }

    /**
     * Create a rule for long text fields.
     *
     * @return static
     */
    public static function long(): static
    {
        return new static(5000);
    }
}

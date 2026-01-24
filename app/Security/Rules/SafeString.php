<?php

namespace App\Security\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class SafeString implements ValidationRule
{
    protected int $maxLength;
    protected bool $allowUnicode;
    protected array $forbiddenPatterns = [];

    public function __construct(int $maxLength = 255, bool $allowUnicode = true)
    {
        $this->maxLength = $maxLength;
        $this->allowUnicode = $allowUnicode;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value)) {
            return;
        }

        $length = $this->allowUnicode ? mb_strlen($value, 'UTF-8') : strlen($value);
        if ($length > $this->maxLength) {
            $fail("O campo :attribute não pode ter mais de {$this->maxLength} caracteres.");
            return;
        }

        if (str_contains($value, "\0")) {
            $fail('O campo :attribute contém caracteres inválidos.');
            return;
        }

        if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) {
            $fail('O campo :attribute contém caracteres de controle inválidos.');
            return;
        }

        foreach ($this->forbiddenPatterns as $pattern) {
            if (preg_match($pattern, $value)) {
                $fail('O campo :attribute contém conteúdo não permitido.');
                return;
            }
        }

        $xssRule = new NoXss();
        $xssRule->validate($attribute, $value, $fail);
    }

    public function forbidPatterns(array $patterns): static
    {
        $this->forbiddenPatterns = array_merge($this->forbiddenPatterns, $patterns);
        return $this;
    }

    public static function short(): static
    {
        return new static(100);
    }

    public static function medium(): static
    {
        return new static(500);
    }

    public static function long(): static
    {
        return new static(5000);
    }
}

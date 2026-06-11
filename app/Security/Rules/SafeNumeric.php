<?php

namespace App\Security\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class SafeNumeric implements ValidationRule
{
    protected ?float $min;

    protected ?float $max;

    protected int $decimals;

    protected bool $allowNegative;

    public function __construct(
        ?float $min = null,
        ?float $max = null,
        int $decimals = 2,
        bool $allowNegative = false
    ) {
        $this->min = $min;
        $this->max = $max;
        $this->decimals = $decimals;
        $this->allowNegative = $allowNegative;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (is_null($value)) {
            return;
        }

        if (! is_numeric($value)) {
            $fail('O campo :attribute deve ser um número válido.');

            return;
        }

        $numericValue = (float) $value;

        if (is_nan($numericValue) || is_infinite($numericValue)) {
            $fail('O campo :attribute contém um valor numérico inválido.');

            return;
        }

        if (! $this->allowNegative && $numericValue < 0) {
            $fail('O campo :attribute não pode ser negativo.');

            return;
        }

        if ($this->min !== null && $numericValue < $this->min) {
            $fail("O campo :attribute deve ser no mínimo {$this->min}.");

            return;
        }

        if ($this->max !== null && $numericValue > $this->max) {
            $fail("O campo :attribute deve ser no máximo {$this->max}.");

            return;
        }

        if ($this->decimals >= 0) {
            $stringValue = (string) $value;
            if (str_contains($stringValue, '.')) {
                $decimalPart = explode('.', $stringValue)[1];
                if (strlen($decimalPart) > $this->decimals) {
                    $fail("O campo :attribute não pode ter mais de {$this->decimals} casas decimais.");

                    return;
                }
            }
        }
    }

    public static function money(float $min = 0.01, ?float $max = 999999999.99): static
    {
        return new static($min, $max, 2, false);
    }

    public static function integer(?int $min = null, ?int $max = null): static
    {
        return new static($min, $max, 0, $min === null || $min < 0);
    }

    public static function percentage(): static
    {
        return new static(0, 100, 2, false);
    }

    public static function positiveInteger(?int $max = null): static
    {
        return new static(1, $max, 0, false);
    }
}

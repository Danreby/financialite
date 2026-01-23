<?php

namespace App\Security\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validation rule for safe numeric values.
 * Prevents numeric injection and overflow attacks.
 */
class SafeNumeric implements ValidationRule
{
    /**
     * Minimum allowed value.
     */
    protected ?float $min;

    /**
     * Maximum allowed value.
     */
    protected ?float $max;

    /**
     * Maximum decimal places allowed.
     */
    protected int $decimals;

    /**
     * Whether to allow negative values.
     */
    protected bool $allowNegative;

    /**
     * Create a new rule instance.
     *
     * @param float|null $min
     * @param float|null $max
     * @param int $decimals
     * @param bool $allowNegative
     */
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
        // Allow null values (use required rule separately if needed)
        if (is_null($value)) {
            return;
        }

        // Must be numeric
        if (!is_numeric($value)) {
            $fail('O campo :attribute deve ser um número válido.');
            return;
        }

        $numericValue = (float) $value;

        // Check for NaN or Infinity
        if (is_nan($numericValue) || is_infinite($numericValue)) {
            $fail('O campo :attribute contém um valor numérico inválido.');
            return;
        }

        // Check negative values
        if (!$this->allowNegative && $numericValue < 0) {
            $fail('O campo :attribute não pode ser negativo.');
            return;
        }

        // Check minimum
        if ($this->min !== null && $numericValue < $this->min) {
            $fail("O campo :attribute deve ser no mínimo {$this->min}.");
            return;
        }

        // Check maximum
        if ($this->max !== null && $numericValue > $this->max) {
            $fail("O campo :attribute deve ser no máximo {$this->max}.");
            return;
        }

        // Check decimal places
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

    /**
     * Create a rule for monetary values.
     *
     * @param float $min
     * @param float|null $max
     * @return static
     */
    public static function money(float $min = 0.01, ?float $max = 999999999.99): static
    {
        return new static($min, $max, 2, false);
    }

    /**
     * Create a rule for integer values.
     *
     * @param int|null $min
     * @param int|null $max
     * @return static
     */
    public static function integer(?int $min = null, ?int $max = null): static
    {
        return new static($min, $max, 0, $min === null || $min < 0);
    }

    /**
     * Create a rule for percentage values.
     *
     * @return static
     */
    public static function percentage(): static
    {
        return new static(0, 100, 2, false);
    }

    /**
     * Create a rule for positive integers.
     *
     * @param int|null $max
     * @return static
     */
    public static function positiveInteger(?int $max = null): static
    {
        return new static(1, $max, 0, false);
    }
}

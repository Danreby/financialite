<?php

namespace App\Security\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class NoSqlInjection implements ValidationRule
{
    protected array $patterns = [
        '/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b.*\b(FROM|INTO|TABLE|SET|WHERE)\b)/i',
        '/(\bOR\b|\bAND\b)\s*[\'\"]?\s*\d+\s*=\s*\d+/i',
        '/[\'\"];\s*(DROP|DELETE|UPDATE|INSERT)/i',
        '/--\s*$/m',
        '/\/\*.*\*\//s',
        '/\bEXEC(\s|\+)+(s|x)p\w+/i',
        '/\bxp_\w+/i',
        '/\bsp_\w+/i',
        '/\bHAVING\s+\d+\s*=\s*\d+/i',
        '/\bWAITFOR\s+DELAY/i',
        '/\bSLEEP\s*\(/i',
        '/\bBENCHMARK\s*\(/i',
        '/LOAD_FILE\s*\(/i',
        '/INTO\s+(OUT|DUMP)FILE/i',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value)) {
            return;
        }

        foreach ($this->patterns as $pattern) {
            if (preg_match($pattern, $value)) {
                $fail('O campo :attribute contém caracteres inválidos.');
                return;
            }
        }
    }
}

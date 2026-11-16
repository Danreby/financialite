<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

/**
 * Unicidade sem diferenciar maiúsculas de minúsculas.
 *
 * Os nomes são guardados como o usuário digitou ("Mercado"), então a
 * comparação precisa ser feita no banco com LOWER() em vez de depender
 * do texto já estar em minúsculas.
 */
class UniqueIgnoringCase implements ValidationRule
{
    /**
     * @param  Closure|null  $scope  recebe o query builder para restringir o escopo (usuário, etc.)
     */
    public function __construct(
        private string $table,
        private string $message,
        private ?Closure $scope = null,
        private int|string|null $ignoreId = null,
        private string $column = 'name',
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            return;
        }

        $query = DB::table($this->table)
            ->whereNull('deleted_at')
            ->whereRaw("LOWER({$this->column}) = ?", [mb_strtolower(trim($value), 'UTF-8')]);

        if ($this->ignoreId !== null) {
            $query->where('id', '!=', $this->ignoreId);
        }

        if ($this->scope) {
            ($this->scope)($query);
        }

        if ($query->exists()) {
            $fail($this->message);
        }
    }
}

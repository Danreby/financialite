<?php

namespace App\Queries\Export;

/**
 * Filtros das exportações, os mesmos da tela Relatórios: cartão, categoria,
 * ano (prefixo do mês de fatura) e busca no título.
 */
final class ExportFilters
{
    public function __construct(
        public readonly ?int $bankUserId = null,
        public readonly ?int $categoryId = null,
        public readonly ?string $year = null,
        public readonly ?string $search = null,
    ) {}

    /**
     * @param  array<string, mixed>  $input  dados já validados
     */
    public static function fromArray(array $input): self
    {
        $search = isset($input['search']) ? trim((string) $input['search']) : '';

        return new self(
            bankUserId: isset($input['bank_user_id']) ? (int) $input['bank_user_id'] : null,
            categoryId: isset($input['category_id']) ? (int) $input['category_id'] : null,
            year: isset($input['year']) && $input['year'] !== '' ? (string) $input['year'] : null,
            search: $search !== '' ? $search : null,
        );
    }

    /**
     * A linha passa nos filtros de ano e busca? Mesma regra da tela: ano é
     * prefixo de invoice_month (ou year_month); busca é "contém" no título,
     * sem diferenciar maiúsculas.
     *
     * @param  array<string, mixed>  $row  linha de ExportRowsQuery
     */
    public function matchesRow(array $row): bool
    {
        if ($this->year !== null) {
            $period = (string) ($row['invoice_month'] ?: ($row['year_month'] ?: ''));
            if (! str_starts_with($period, $this->year)) {
                return false;
            }
        }

        if ($this->search !== null) {
            $title = mb_strtolower((string) ($row['title'] ?? ''));
            if (! str_contains($title, mb_strtolower($this->search))) {
                return false;
            }
        }

        return true;
    }
}

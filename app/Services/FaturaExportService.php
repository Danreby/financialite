<?php

namespace App\Services;

use App\Queries\Export\ExportFilters;
use App\Queries\Export\ExportRowsQuery;
use Illuminate\Support\Collection;

/**
 * Linhas de exportação em JSON (tela Relatórios e API). A montagem das linhas
 * fica em ExportRowsQuery, a mesma base das planilhas geradas no servidor.
 */
class FaturaExportService
{
    public function __construct(private ExportRowsQuery $rows) {}

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function exportForUser(int $userId, ?int $bankUserId = null, ?int $categoryId = null): Collection
    {
        $filters = new ExportFilters(bankUserId: $bankUserId, categoryId: $categoryId);

        return collect(iterator_to_array($this->rows->rows($userId, $filters, newestFirst: true), false));
    }
}

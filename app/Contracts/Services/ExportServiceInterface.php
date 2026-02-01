<?php

namespace App\Contracts\Services;

use Illuminate\Support\Collection;

interface ExportServiceInterface
{
    /**
     * Export data for a user.
     *
     * @param int $userId
     * @param int|null $bankUserId
     * @param int|null $categoryId
     * @return Collection
     */
    public function exportForUser(
        int $userId,
        ?int $bankUserId = null,
        ?int $categoryId = null
    ): Collection;

    /**
     * Export data to CSV format.
     *
     * @param int $userId
     * @param int|null $bankUserId
     * @param int|null $categoryId
     * @return string CSV content
     */
    public function exportToCsv(
        int $userId,
        ?int $bankUserId = null,
        ?int $categoryId = null
    ): string;
}

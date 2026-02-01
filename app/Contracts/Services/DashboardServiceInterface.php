<?php

namespace App\Contracts\Services;

use Illuminate\Support\Collection;

interface DashboardServiceInterface
{
    /**
     * Build complete dashboard statistics for a user.
     *
     * @param int $userId
     * @param int|null $bankUserId
     * @param int|null $categoryId
     * @return array
     */
    public function buildStats(
        int $userId,
        ?int $bankUserId = null,
        ?int $categoryId = null
    ): array;

    /**
     * Get monthly summary for a user.
     *
     * @param int $userId
     * @param string $monthKey
     * @param int|null $bankUserId
     * @return array
     */
    public function getMonthlySummary(
        int $userId,
        string $monthKey,
        ?int $bankUserId = null
    ): array;

    /**
     * Get available months with transactions.
     *
     * @param int $userId
     * @return Collection
     */
    public function getAvailableMonths(int $userId): Collection;
}

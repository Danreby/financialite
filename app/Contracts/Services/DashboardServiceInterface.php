<?php

namespace App\Contracts\Services;

use Illuminate\Support\Collection;

interface DashboardServiceInterface
{
    /**
     * Build complete dashboard statistics for a user.
     */
    public function buildStats(
        int $userId,
        ?int $bankUserId = null,
        ?int $categoryId = null
    ): array;

    /**
     * Get monthly summary for a user.
     */
    public function getMonthlySummary(
        int $userId,
        string $monthKey,
        ?int $bankUserId = null
    ): array;

    /**
     * Get available months with transactions.
     */
    public function getAvailableMonths(int $userId): Collection;
}

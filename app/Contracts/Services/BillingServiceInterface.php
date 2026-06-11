<?php

namespace App\Contracts\Services;

use App\Models\Transacao;
use Carbon\Carbon;

interface BillingServiceInterface
{
    /**
     * Resolve the billing month key for a transaction.
     *
     * @return string Month key in format 'YYYY-MM'
     */
    public function resolveBillingMonthKey(Transacao $transacao): string;

    /**
     * Determine if a fatura applies to a target month.
     */
    public function faturaAppliesToMonth(Transacao $transacao, Carbon $targetMonth): bool;

    /**
     * Calculate the cutoff date for a given due day.
     */
    public function calculateCutoffDate(int $dueDay, Carbon $referenceDate): Carbon;
}

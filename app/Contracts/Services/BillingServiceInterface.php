<?php

namespace App\Contracts\Services;

use App\Models\Transacao;
use Carbon\Carbon;

interface BillingServiceInterface
{
    /**
     * Resolve the billing month key for a transaction.
     *
     * @param Transacao $transacao
     * @return string Month key in format 'YYYY-MM'
     */
    public function resolveBillingMonthKey(Transacao $transacao): string;

    /**
     * Determine if a fatura applies to a target month.
     *
     * @param Transacao $transacao
     * @param Carbon $targetMonth
     * @return bool
     */
    public function faturaAppliesToMonth(Transacao $transacao, Carbon $targetMonth): bool;

    /**
     * Calculate the cutoff date for a given due day.
     *
     * @param int $dueDay
     * @param Carbon $referenceDate
     * @return Carbon
     */
    public function calculateCutoffDate(int $dueDay, Carbon $referenceDate): Carbon;
}

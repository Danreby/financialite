<?php

namespace App\Observers;

use App\Models\Transacao;
use App\Services\BudgetAlertService;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;

/**
 * Observes Transacao lifecycle events to trigger real-time budget alerts.
 *
 * Implements ShouldHandleEventsAfterCommit so that the budget check and
 * notification creation happen AFTER the outer DB transaction commits,
 * preventing stale reads and ensuring notifications are not rolled back
 * alongside a failed transacao save.
 */
class TransacaoObserver implements ShouldHandleEventsAfterCommit
{
    public function __construct(private BudgetAlertService $budgetAlert) {}

    public function created(Transacao $transacao): void
    {
        $this->evaluateBudget($transacao);
    }

    public function updated(Transacao $transacao): void
    {
        $this->evaluateBudget($transacao);
    }

    private function evaluateBudget(Transacao $transacao): void
    {
        if ($transacao->type !== 'debit') {
            return;
        }

        $user = $transacao->user;

        if (! $user) {
            return;
        }

        try {
            $this->budgetAlert->checkForUser($user);
        } catch (\Throwable $e) {
            // Budget alerts are non-critical; log and continue so the main
            // request is never broken by a notification failure.
            report($e);
        }
    }
}

<?php

namespace App\Observers;

use App\Models\Transacao;
use App\Services\BudgetAlertService;

class TransacaoObserver
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

        $this->budgetAlert->checkForUser($user);
    }
}

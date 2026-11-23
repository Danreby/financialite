<?php

namespace App\Actions\Budget;

use App\Models\Budget;
use App\Models\Income;
use App\Models\User;
use App\Support\Money;

/**
 * Devolve o orçamento do mês corrente, criando-o se ainda não existir. O limite
 * inicial é 80% da renda ativa do usuário, ou R$ 5.000,00 sem renda cadastrada.
 * Usada por BudgetController::getOrCreateCurrent e BudgetApiController::getOrCreateCurrent.
 */
class GetOrCreateCurrentBudget
{
    public const DEFAULT_LIMIT_CENTS = 500000;

    public function handle(User $user): Budget
    {
        $month = now()->format('Y-m');

        $budget = Budget::forUser($user->id)->forMonth($month)->first();
        if ($budget) {
            return $budget;
        }

        $incomeCents = Money::fromDecimal((string) Income::forUser($user->id)->where('is_active', true)->sum('amount'));
        $limitCents = $incomeCents > 0 ? (int) round($incomeCents * 0.8) : self::DEFAULT_LIMIT_CENTS;

        // createOrFirst: duas requisições simultâneas esbarram no índice único
        // (user_id, month_year) e a segunda lê o orçamento criado pela primeira.
        return Budget::createOrFirst(
            ['user_id' => $user->id, 'month_year' => $month],
            ['monthly_limit' => Money::toDecimal($limitCents), 'is_active' => true],
        );
    }
}

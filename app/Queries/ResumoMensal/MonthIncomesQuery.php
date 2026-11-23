<?php

namespace App\Queries\ResumoMensal;

use App\Models\Income;
use Carbon\Carbon;

/**
 * Receitas do mês no Resumo mensal: as recorrentes ativas (valem todo mês) e as
 * avulsas ativas recebidas no mês.
 */
class MonthIncomesQuery
{
    /**
     * @return list<array<string, mixed>>
     */
    public function get(int $userId, Carbon $month): array
    {
        $recurring = Income::forUser($userId)
            ->active()
            ->recurring()
            ->with('bankUser.card', 'bankAccount.bank')
            ->orderBy('title')
            ->get()
            ->map(fn (Income $income) => $this->row($income, $income->payment_day_label, true));

        $oneTime = Income::forUser($userId)
            ->active()
            ->oneTime()
            ->with('bankUser.card', 'bankAccount.bank')
            ->whereYear('received_at', $month->year)
            ->whereMonth('received_at', $month->month)
            ->orderByDesc('received_at')
            ->get()
            ->map(fn (Income $income) => $this->row($income, $income->received_at?->format('d/m/Y'), false));

        return $recurring->merge($oneTime)->values()->toArray();
    }

    /** @return array<string, mixed> */
    private function row(Income $income, ?string $paymentDayLabel, bool $isRecurring): array
    {
        return [
            'id' => $income->id,
            'title' => $income->title,
            'description' => $income->description,
            'amount' => (float) $income->amount,
            'type' => $income->type,
            'type_label' => $income->type_label,
            'payment_day_label' => $paymentDayLabel,
            'is_recurring' => $isRecurring,
            'bank_name' => optional($income->bankUser?->card)->name,
            'bank_account_name' => optional($income->bankAccount?->bank)->name,
        ];
    }
}

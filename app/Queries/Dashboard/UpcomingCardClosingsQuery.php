<?php

namespace App\Queries\Dashboard;

use App\Models\CardUser;
use Carbon\Carbon;

/**
 * Próximo fechamento de cada cartão (next_card_due_date do stats), do mais
 * próximo ao mais distante. Usa closing_day e, sem ele, due_day. As chaves
 * days_until_due/next_due_date guardam o nome antigo, mas são do fechamento.
 */
class UpcomingCardClosingsQuery
{
    /**
     * @return array{cards: list<array<string, mixed>>, nearest: array<string, mixed>|null}
     */
    public function get(int $userId, ?int $bankUserId = null): array
    {
        $today = Carbon::today();

        $cards = CardUser::with('card')
            ->forUser($userId)
            ->where(fn ($q) => $q->whereNotNull('closing_day')->orWhereNotNull('due_day'))
            ->when($bankUserId, fn ($q) => $q->where('id', $bankUserId))
            ->get();

        if ($cards->isEmpty()) {
            return ['cards' => [], 'nearest' => null];
        }

        $results = $cards->map(function (CardUser $cardUser) use ($today) {
            $closingDay = (int) ($cardUser->closing_day ?? $cardUser->due_day);

            $candidateDay = min($closingDay, (int) $today->copy()->endOfMonth()->format('d'));
            $thisMonthClose = $today->copy()->setDay($candidateDay);

            if ($thisMonthClose->lt($today)) {
                $nextMonth = $today->copy()->addMonthNoOverflow();
                $candidateDay = min($closingDay, (int) $nextMonth->endOfMonth()->format('d'));
                $nextClose = $nextMonth->setDay($candidateDay);
            } else {
                $nextClose = $thisMonthClose;
            }

            return [
                'card_id' => $cardUser->id,
                'card_name' => $cardUser->card->name ?? ('Cartão #'.$cardUser->id),
                'closing_day' => $closingDay,
                'days_until_due' => (int) $today->diffInDays($nextClose),
                'next_due_date' => $nextClose->toDateString(),
            ];
        })->sortBy('days_until_due')->values()->all();

        return [
            'cards' => $results,
            'nearest' => $results[0] ?? null,
        ];
    }
}

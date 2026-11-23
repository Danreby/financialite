<?php

namespace App\Queries\ResumoMensal;

use App\Enums\TransacaoType;
use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Débitos do mês agrupados pela conta do lançamento no Resumo mensal. Os sem
 * conta vão para o grupo "Sem banco", sempre por último.
 */
class ExpensesByBankQuery
{
    /**
     * @return list<array{bank_user_id: int|null, bank_name: string, total: float, count: int, transactions: list<array<string, mixed>>}>
     */
    public function get(int $userId, Carbon $month): array
    {
        $debits = Transacao::with(['category', 'bankUser.card'])
            ->forUser($userId)
            ->where('type', TransacaoType::Debit)
            ->whereBetween('created_at', [$month, $month->copy()->endOfMonth()])
            ->get();

        $withBank = $debits->filter(fn (Transacao $t) => $t->bank_user_id !== null);
        $withoutBank = $debits->filter(fn (Transacao $t) => $t->bank_user_id === null);

        $groups = $withBank->groupBy('bank_user_id')
            ->map(function ($items) {
                $first = $items->first();

                return $this->group(
                    $first->bank_user_id,
                    optional($first->bankUser?->card)->name ?? 'Banco desconhecido',
                    $items
                );
            })
            ->sortByDesc('total')
            ->values();

        if ($withoutBank->isNotEmpty()) {
            $groups->push($this->group(null, 'Sem banco', $withoutBank));
        }

        return $groups->toArray();
    }

    /**
     * @param  Collection<int, Transacao>  $items
     * @return array<string, mixed>
     */
    private function group(?int $bankUserId, string $name, Collection $items): array
    {
        $transactions = $items->map(fn (Transacao $t) => [
            'id' => $t->id,
            'title' => $t->title,
            'amount' => (float) $t->amount,
            'category_name' => optional($t->category)->name,
            'category_icon' => optional($t->category)->icon,
            'category_color' => optional($t->category)->color,
            'date' => $t->created_at?->format('d/m'),
            'is_recurring' => (bool) $t->is_recurring,
        ])->sortByDesc('amount')->values()->toArray();

        return [
            'bank_user_id' => $bankUserId,
            'bank_name' => $name,
            'total' => round(collect($transactions)->sum('amount'), 2),
            'count' => count($transactions),
            'transactions' => $transactions,
        ];
    }
}

<?php

namespace App\Queries;

use App\Models\CardUser;
use App\Models\Category;
use App\Models\Transacao;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Dados da página "Transações" (lista paginada com filtros, totais do filtro,
 * cartões, categorias e meses com lançamentos). Só lê; não grava nada.
 *
 * Usada por TransacaoController::transactionsList.
 */
class TransactionListQuery
{
    private const PER_PAGE = 15;

    /** @var array<string, array{0: string, 1: string}> */
    private const ORDERS = [
        'created_asc' => ['created_at', 'asc'],
        'created_desc' => ['created_at', 'desc'],
        'title_asc' => ['title', 'asc'],
        'title_desc' => ['title', 'desc'],
        'amount_asc' => ['amount', 'asc'],
        'amount_desc' => ['amount', 'desc'],
    ];

    /**
     * @param  array<string, mixed>  $params  parâmetros da query string (type, bank_user_id,
     *                                        category_id, status, order, month_key, recurring, search)
     * @return array<string, mixed> props da página Inertia
     */
    public function get(User $user, array $params): array
    {
        $filters = [
            'type' => $params['type'] ?? null,
            'bank_user_id' => $params['bank_user_id'] ?? null,
            'category_id' => $params['category_id'] ?? null,
            'status' => $params['status'] ?? null,
        ];

        $order = $params['order'] ?? 'created_desc';
        $monthKey = $params['month_key'] ?? null;
        $monthRange = $this->monthRange($monthKey);

        $recurringParam = $params['recurring'] ?? null;
        if ($recurringParam === 'recurring') {
            $filters['is_recurring'] = true;
        } elseif ($recurringParam === 'non_recurring') {
            $filters['is_recurring'] = false;
        }

        $search = trim((string) ($params['search'] ?? ''));

        $scoped = fn (Builder $query) => $this->applyFilters($query, $user, $filters, $monthRange, $search);

        $filterTotalsRow = $scoped(Transacao::query())
            ->selectRaw("
                COUNT(*) as total_count,
                SUM(CASE WHEN type = 'debit'  THEN amount ELSE 0 END) as debit_total,
                SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as credit_total,
                SUM(CASE WHEN type = 'debit'  THEN 1 ELSE 0 END) as debit_count,
                SUM(CASE WHEN type = 'credit' THEN 1 ELSE 0 END) as credit_count
            ")
            ->first();

        $filterTotals = [
            'total_count' => (int) ($filterTotalsRow->total_count ?? 0),
            'debit_total' => (float) ($filterTotalsRow->debit_total ?? 0),
            'credit_total' => (float) ($filterTotalsRow->credit_total ?? 0),
            'debit_count' => (int) ($filterTotalsRow->debit_count ?? 0),
            'credit_count' => (int) ($filterTotalsRow->credit_count ?? 0),
        ];

        [$orderColumn, $orderDirection] = self::ORDERS[$order] ?? self::ORDERS['created_desc'];

        $transactions = $scoped(Transacao::with(['bankUser.card', 'category'])->withCount('anexos'))
            ->orderBy($orderColumn, $orderDirection)
            ->paginate(self::PER_PAGE, ['*'], 'transactions_page')
            ->withQueryString()
            ->through(fn (Transacao $transacao) => [
                'id' => $transacao->id,
                'title' => $transacao->title,
                'description' => $transacao->description,
                'amount' => (float) $transacao->amount,
                'type' => $transacao->type,
                'status' => $transacao->status,
                'paid_date' => $transacao->paid_date,
                'created_at' => $transacao->created_at,
                'total_installments' => $transacao->total_installments,
                'current_installment' => $transacao->current_installment,
                'is_recurring' => (bool) $transacao->is_recurring,
                'bank_user_id' => $transacao->bank_user_id,
                'bank_name' => optional($transacao->bankUser->card ?? null)->name ?? null,
                'category_id' => $transacao->category_id,
                'category_name' => $transacao->category->name ?? null,
                'category_icon' => $transacao->category->icon ?? null,
                'category_color' => $transacao->category->color ?? null,
                'anexos_count' => $transacao->anexos_count ?? 0,
            ]);

        return [
            'transactions' => $transactions,
            'bankAccounts' => $this->bankAccounts($user),
            'categories' => Category::forUser($user->id)->ordered()->get(['id', 'name', 'icon', 'color']),
            'months' => $this->months($user),
            'filterTotals' => $filterTotals,
            'filters' => [
                'type' => $filters['type'],
                'bank_user_id' => $filters['bank_user_id'],
                'category_id' => $filters['category_id'],
                'status' => $filters['status'],
                'recurring' => $recurringParam,
                'search' => $search,
                'month_key' => $monthKey,
                'order' => $order,
            ],
        ];
    }

    /**
     * Filtros comuns aos totais e à lista: os dois precisam bater.
     *
     * @param  Builder<Transacao>  $query
     * @param  array<string, mixed>  $filters
     * @param  array{0: Carbon, 1: Carbon}|null  $monthRange
     * @return Builder<Transacao>
     */
    private function applyFilters(Builder $query, User $user, array $filters, ?array $monthRange, string $search): Builder
    {
        return $query
            ->forUser($user->id)
            ->filter($filters)
            ->when($monthRange, fn ($q) => $q->whereBetween('created_at', $monthRange))
            ->when($search !== '', fn ($q) => $q->titleContains($search));
    }

    /** @return array{0: Carbon, 1: Carbon}|null */
    private function monthRange(mixed $monthKey): ?array
    {
        if (! $monthKey) {
            return null;
        }

        try {
            $monthDate = Carbon::parse($monthKey.'-01');
        } catch (\Throwable) {
            return null;
        }

        return [$monthDate->copy()->startOfMonth(), $monthDate->copy()->endOfMonth()];
    }

    /** @return array<int, array{id: int, name: string}> */
    private function bankAccounts(User $user): array
    {
        return CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(fn ($cardUser) => [
                'id' => $cardUser->id,
                'name' => $cardUser->card->name ?? ('Cartão #'.$cardUser->id),
            ])
            ->sortBy('name')
            ->values()
            ->all();
    }

    /** @return Collection<int, array{month_key: string, month_label: string, is_paid: bool}> */
    private function months(User $user)
    {
        return Transacao::where('user_id', $user->id)
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month_key")
            ->groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
            ->orderByRaw("DATE_FORMAT(created_at, '%Y-%m') DESC")
            ->pluck('month_key')
            ->filter()
            ->unique()
            ->values()
            ->map(function (string $key) {
                try {
                    $label = Carbon::parse($key.'-01')->translatedFormat('F Y');
                } catch (\Throwable) {
                    $label = $key;
                }

                return [
                    'month_key' => $key,
                    'month_label' => ucfirst($label),
                    'is_paid' => false,
                ];
            });
    }
}

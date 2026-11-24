<?php

namespace App\Queries\Dashboard;

use App\Enums\TransacaoType;
use App\Models\CardUser;
use App\Models\Transacao;
use App\Services\FaturaBillingService;
use Illuminate\Database\Eloquent\Builder;

/**
 * Faturas mês a mês da tela Fatura e da lista do Dashboard: as compras no cartão
 * agrupadas por mês de fatura, com as contas a pagar previstas em cada mês, e o
 * mês que a tela abre (a fatura corrente ainda em aberto).
 */
class InvoiceMonthsQuery
{
    public function __construct(
        private FaturaBillingService $billing,
        private PaidInvoicesByMonthQuery $paidByMonth,
        private BillsByInvoiceMonthQuery $bills,
    ) {}

    /**
     * Lançamentos do usuário com os filtros da tela, mais recentes primeiro
     * (a lista paginada do Dashboard e de GET /transacoes).
     *
     * @param  array<string, mixed>  $filters
     * @return Builder<Transacao>
     */
    public function transactions(int $userId, array $filters): Builder
    {
        return Transacao::with(['bankUser.card', 'user', 'category', 'parcelas'])
            ->withCount('anexos')
            ->forUser($userId)
            ->filter($filters)
            ->orderBy('created_at', 'desc');
    }

    /**
     * @param  array<string, mixed>  $filters  bank_user_id, category_id e os de Transacao::scopeFilter
     * @return array{monthly_groups: list<array<string, mixed>>, current_month_key: string}
     */
    public function get(int $userId, array $filters): array
    {
        $bankUserId = $filters['bank_user_id'] ?? null;

        $selectedBankUser = $bankUserId
            ? CardUser::forUser($userId)->findOrFail($bankUserId)
            : null;

        $creditTransactions = $this->transactions($userId, $filters)
            ->where('type', TransacaoType::Credit)
            ->get();

        $paidByMonth = $this->paidByMonth->get(
            $userId,
            $bankUserId,
            array_key_exists('bank_user_id', $filters)
        );

        $monthlyGroups = $this->billing->groupFaturasByMonth($creditTransactions, $paidByMonth);

        $effective = $this->billing->resolveEffectiveGroup(
            $monthlyGroups,
            $this->billing->resolveCurrentBillingMonthKey($selectedBankUser)
        );

        return [
            'monthly_groups' => $this->bills->attach($userId, $monthlyGroups),
            'current_month_key' => $effective['month_key'],
        ];
    }
}

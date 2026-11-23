<?php

namespace App\Queries\Dashboard;

use App\Enums\TransacaoType;
use App\Models\CardUser;
use App\Models\Transacao;
use App\Services\FaturaBillingService;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Qual fatura o Dashboard mostra como "corrente": a do mês de fatura de hoje
 * (pelo fechamento do cartão filtrado) se ainda estiver em aberto; senão, a
 * próxima em aberto; senão, a do mês de hoje mesmo paga.
 */
class CurrentInvoiceQuery
{
    public function __construct(private FaturaBillingService $billing) {}

    /**
     * @param  Collection<array-key, mixed>  $paidByMonth  saída de PaidInvoicesByMonthQuery
     * @return array{month_key: string, group: array<string, mixed>|null, target_month: Carbon}
     */
    public function get(int $userId, ?int $bankUserId, ?int $categoryId, Collection $paidByMonth): array
    {
        $selectedBankUser = $bankUserId
            ? CardUser::forUser($userId)->findOrFail($bankUserId)
            : null;

        $creditTransactions = Transacao::with(['bankUser', 'parcelas'])
            ->forUser($userId)
            ->forBankUser($bankUserId)
            ->when($categoryId, fn ($q, $categoryId) => $q->where('category_id', $categoryId))
            ->where('type', TransacaoType::Credit)
            ->orderBy('created_at', 'desc')
            ->get();

        $monthlyGroups = $this->billing->groupFaturasByMonth($creditTransactions, $paidByMonth);

        $effective = $this->billing->resolveEffectiveGroup(
            $monthlyGroups,
            $this->billing->resolveCurrentBillingMonthKey($selectedBankUser)
        );

        try {
            $targetMonth = Carbon::parse($effective['month_key'].'-01');
        } catch (\Throwable) {
            $targetMonth = Carbon::today()->startOfMonth();
        }

        return [
            'month_key' => $effective['month_key'],
            'group' => $effective['group'],
            'target_month' => $targetMonth,
        ];
    }
}

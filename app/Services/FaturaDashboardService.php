<?php

namespace App\Services;

use App\Models\CardUser;
use App\Models\Category;
use App\Queries\Dashboard\CurrentInvoiceQuery;
use App\Queries\Dashboard\InvoiceMonthsQuery;
use App\Queries\Dashboard\MonthlyTotalsQuery;
use App\Queries\Dashboard\PaidInvoicesByMonthQuery;
use App\Queries\Dashboard\SpendingSeriesQuery;
use App\Queries\Dashboard\TopCategoriesQuery;
use App\Queries\Dashboard\TransactionStatusTotalsQuery;
use App\Queries\Dashboard\UpcomingCardClosingsQuery;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Fachada dos dados do Dashboard, da tela Fatura e dos endpoints de stats e
 * top-spending (web e API). Cada pergunta é respondida por uma Query em
 * app/Queries/Dashboard; aqui só se monta a resposta com as chaves e a ordem
 * que o front e o app Android esperam.
 */
class FaturaDashboardService
{
    public function __construct(
        private InvoiceMonthsQuery $invoiceMonths,
        private PaidInvoicesByMonthQuery $paidByMonth,
        private TransactionStatusTotalsQuery $statusTotals,
        private SpendingSeriesQuery $spendingSeries,
        private CurrentInvoiceQuery $currentInvoice,
        private MonthlyTotalsQuery $monthlyTotals,
        private TopCategoriesQuery $topCategories,
        private UpcomingCardClosingsQuery $cardClosings,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function buildDashboardData(Authenticatable $user, array $filters): array
    {
        $invoices = $this->invoiceMonths->get($user->id, $filters);

        $bankAccounts = CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(fn (CardUser $cardUser) => [
                'id' => $cardUser->id,
                'name' => $cardUser->card->name ?? ('Cartão #'.$cardUser->id),
                'due_day' => $cardUser->due_day,
                'closing_day' => $cardUser->closing_day,
            ]);

        return [
            'base_query' => $this->invoiceMonths->transactions($user->id, $filters),
            'monthly_groups' => $invoices['monthly_groups'],
            'bank_accounts' => $bankAccounts,
            'current_month_key' => $invoices['current_month_key'],
            'categories' => Category::forUser($user->id)->ordered()->get(['id', 'name', 'icon', 'color']),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function buildStats(Authenticatable $user, ?int $bankUserId, ?int $categoryId, bool $filterBankUser): array
    {
        $userId = $user->id;
        $today = Carbon::today();

        $paidByMonth = $this->paidByMonth->get($userId, $bankUserId, $filterBankUser);

        $stats = $this->statusTotals->get($userId, $bankUserId, $categoryId);

        $monthlySummary = $this->spendingSeries->get(
            $userId,
            $bankUserId,
            $categoryId,
            $today->copy()->startOfMonth()->subMonthsNoOverflow(5),
            $today->copy()->endOfMonth(),
            $paidByMonth
        );

        $invoice = $this->currentInvoice->get($userId, $bankUserId, $categoryId, $paidByMonth);
        $totals = $this->monthlyTotals->get($userId, $bankUserId, $categoryId, $invoice['group']);
        $categories = $this->topCategories->forInvoiceMonth(
            $userId,
            $bankUserId,
            $categoryId,
            $invoice['month_key'],
            $invoice['target_month']
        );

        $monthLabel = $invoice['group']['month_label'] ?? null;

        return $stats + [
            'current_month_key' => $invoice['month_key'],
            'current_month_label' => $monthLabel,
            'top_spending_label' => $monthLabel ?: ucfirst(
                $invoice['target_month']->locale(config('app.locale', 'pt_BR'))->translatedFormat('F Y')
            ),
            'current_month_pending_bill' => $totals['pending_bill'],
            'current_month_debit_total' => $totals['debit_total'],
            'monthly_summary' => $monthlySummary,
            'top_spending_categories' => $categories['top_spending_categories'],
            'debit_spending_categories' => $categories['debit_spending_categories'],
            'credit_spending_categories' => $categories['credit_spending_categories'],
            'recurring_spending' => $categories['recurring_spending'],
            'non_recurring_spending' => $categories['non_recurring_spending'],
            'total_monthly_income' => $totals['total_monthly_income'],
            'remaining_money' => $totals['remaining_money'],
            'next_card_due_date' => $this->cardClosings->get($userId, $bankUserId),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function getTopSpendingByPeriod(
        Authenticatable $user,
        string $monthFrom,
        string $monthTo,
        ?int $bankUserId = null,
        ?int $categoryId = null
    ): array {
        return $this->topCategories->forPeriod($user->id, $monthFrom, $monthTo, $bankUserId, $categoryId);
    }
}

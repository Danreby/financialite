<?php

namespace Tests\Feature\Queries;

use App\Queries\Dashboard\CurrentInvoiceQuery;
use App\Queries\Dashboard\InvoiceMonthsQuery;
use App\Queries\Dashboard\MonthlyTotalsQuery;
use App\Queries\Dashboard\PaidInvoicesByMonthQuery;
use App\Queries\Dashboard\SpendingSeriesQuery;
use App\Queries\Dashboard\TopCategoriesQuery;
use App\Queries\Dashboard\TransactionStatusTotalsQuery;
use App\Queries\Dashboard\UpcomingCardClosingsQuery;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\FinanceScenario;
use Tests\TestCase;

/**
 * Cada Query do Dashboard sobre o cenário de FinanceScenario (hoje 15/11/2026).
 * As contas de cada número estão nos comentários.
 */
class DashboardQueriesTest extends TestCase
{
    use FinanceScenario;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedFinanceScenario();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_paid_invoices_by_month(): void
    {
        $query = app(PaidInvoicesByMonthQuery::class);

        // Sem filtro: a fatura de outubro do cartão, paga em 01/11.
        $all = $query->get($this->user->id);
        $this->assertSame(['2026-10'], $all->keys()->all());
        $this->assertEqualsWithDelta(220.0, $all['2026-10']->total_paid, 0.001);

        // Filtro pelo cartão: mesmo registro.
        $this->assertEqualsWithDelta(220.0, (float) $query->get($this->user->id, $this->card->id, true)['2026-10']->total_paid, 0.001);

        // Filtro presente mas vazio: só faturas sem cartão, que não existem.
        $this->assertTrue($query->get($this->user->id, null, true)->isEmpty());
    }

    public function test_transaction_status_totals(): void
    {
        $query = app(TransactionStatusTotalsQuery::class);

        $all = $query->get($this->user->id);
        $this->assertEqualsWithDelta(120.0, (float) $all['total_income'], 0.001);      // cinema pago
        $this->assertEqualsWithDelta(320.0, (float) $all['total_expenses'], 0.001);    // 200 + 80 + 40
        $this->assertEqualsWithDelta(500.0, (float) $all['pending_income'], 0.001);    // 300 + 50 + 90 + 60
        $this->assertEqualsWithDelta(0.0, (float) $all['pending_expenses'], 0.001);
        $this->assertSame(0, $all['overdue_count']);

        $card = $query->get($this->user->id, $this->card->id);
        $this->assertEqualsWithDelta(200.0, (float) $card['total_expenses'], 0.001);   // só a padaria
        $this->assertEqualsWithDelta(440.0, (float) $card['pending_income'], 0.001);   // 300 + 50 + 90

        $mercado = $query->get($this->user->id, null, $this->mercado->id);
        $this->assertEqualsWithDelta(240.0, (float) $mercado['total_expenses'], 0.001); // 200 + 40
        $this->assertEqualsWithDelta(360.0, (float) $mercado['pending_income'], 0.001); // 300 + 60
    }

    public function test_current_invoice(): void
    {
        $query = app(CurrentInvoiceQuery::class);
        $paid = app(PaidInvoicesByMonthQuery::class);

        // Sem cartão, o mês de fatura é o de hoje: novembro em aberto
        // (100 + 50 + 90 + 30 = 270).
        $invoice = $query->get($this->user->id, null, null, $paid->get($this->user->id));
        $this->assertSame('2026-11', $invoice['month_key']);
        $this->assertSame('2026-11-01', $invoice['target_month']->toDateString());
        $this->assertEqualsWithDelta(270.0, $invoice['group']['total_spent'], 0.001);

        // Com o cartão (fecha dia 5), hoje já é fatura de dezembro: 3ª parcela
        // do mercadoX3 + streaming = 150.
        $invoice = $query->get($this->user->id, $this->card->id, null, $paid->get($this->user->id, $this->card->id, true));
        $this->assertSame('2026-12', $invoice['month_key']);
        $this->assertEqualsWithDelta(150.0, $invoice['group']['total_spent'], 0.001);
    }

    public function test_monthly_totals(): void
    {
        $paid = app(PaidInvoicesByMonthQuery::class)->get($this->user->id);
        $invoice = app(CurrentInvoiceQuery::class)->get($this->user->id, null, null, $paid);

        $totals = app(MonthlyTotalsQuery::class)->get($this->user->id, null, null, $invoice['group']);

        $this->assertEqualsWithDelta(270.0, $totals['pending_bill'], 0.001);
        $this->assertEqualsWithDelta(120.0, $totals['debit_total'], 0.001);            // 80 + 40 em novembro
        $this->assertEqualsWithDelta(5300.0, $totals['total_monthly_income'], 0.001);  // salário + pix ativos
        $this->assertEqualsWithDelta(4910.0, $totals['remaining_money'], 0.001);       // 5300 - 270 - 120

        // Fatura já quitada não deixa nada a pagar.
        $paidGroup = ['is_paid' => true, 'total_spent' => 220.0, 'total_paid' => 220.0];
        $this->assertSame(0.0, app(MonthlyTotalsQuery::class)->get($this->user->id, null, null, $paidGroup)['pending_bill']);
    }

    public function test_top_categories_for_invoice_month(): void
    {
        $result = app(TopCategoriesQuery::class)
            ->forInvoiceMonth($this->user->id, null, null, '2026-11', Carbon::parse('2026-11-01'));

        // Mercado: 40 (açougue) + 100 (2ª parcela) + 30 (feira); Lazer: 80 (bar) + 50 (streaming).
        $this->assertSame(
            ['Mercado' => 170.0, 'Lazer' => 130.0, 'Sem categoria' => 90.0],
            $this->totals($result['top_spending_categories'])
        );
        $this->assertSame(['Lazer' => 80.0, 'Mercado' => 40.0], $this->totals($result['debit_spending_categories']));
        $this->assertSame(
            ['Mercado' => 130.0, 'Sem categoria' => 90.0, 'Lazer' => 50.0],
            $this->totals($result['credit_spending_categories'])
        );
        // 50 de 390 é recorrente.
        $this->assertSame(['total' => 50.0, 'percentage' => 12.8], $result['recurring_spending']);
        $this->assertSame(['total' => 340.0, 'percentage' => 87.2], $result['non_recurring_spending']);
    }

    public function test_top_categories_for_period(): void
    {
        $result = app(TopCategoriesQuery::class)->forPeriod($this->user->id, '2026-10', '2026-12');

        // Débito: padaria 200 + açougue 40 (Mercado), bar 80 (Lazer).
        // Crédito: mercadoX3 300 + feira 60 (Mercado), cinema 120 + streaming 2 x 50 (Lazer), farmácia 90.
        $this->assertSame(
            ['Mercado' => 600.0, 'Lazer' => 300.0, 'Sem categoria' => 90.0],
            $this->totals($result['top_spending_categories'])
        );
        $this->assertSame(
            ['Mercado' => 360.0, 'Lazer' => 220.0, 'Sem categoria' => 90.0],
            $this->totals($result['credit_spending_categories'])
        );
        $this->assertSame('Out 2026 — Dez 2026', $result['period_label']);
        $this->assertSame(['total' => 100.0, 'percentage' => 10.1], $result['recurring_spending']);

        $single = app(TopCategoriesQuery::class)->forPeriod($this->user->id, '2026-11', '2026-11', $this->card->id);
        $this->assertSame('Nov 2026', $single['period_label']);
        // Só o cartão em novembro: 100 + 50 + 90, sem débito.
        $this->assertSame(
            ['Mercado' => 100.0, 'Sem categoria' => 90.0, 'Lazer' => 50.0],
            $this->totals($single['top_spending_categories'])
        );
    }

    public function test_spending_series(): void
    {
        $series = app(SpendingSeriesQuery::class)->get(
            $this->user->id,
            null,
            null,
            Carbon::parse('2026-09-01'),
            Carbon::parse('2026-11-30 23:59:59'),
            app(PaidInvoicesByMonthQuery::class)->get($this->user->id)
        );

        $this->assertSame(['2026-09', '2026-10', '2026-11'], array_column($series, 'month_key'));
        $this->assertSame(['Set 2026', 'Out 2026', 'Nov 2026'], array_column($series, 'month_label'));
        // Outubro: 1ª parcela 100 + cinema 120; novembro: 100 + 50 + 90 + 30.
        $this->assertSame([0.0, 220.0, 270.0], array_column($series, 'credit_total'));
        $this->assertSame([0.0, 200.0, 120.0], array_column($series, 'debit_total'));
        $this->assertSame([0.0, 220.0, 0.0], array_column($series, 'invoice_total'));
    }

    public function test_upcoming_card_closings(): void
    {
        $result = app(UpcomingCardClosingsQuery::class)->get($this->user->id);

        // O fechamento de novembro (dia 5) já passou; o próximo é 05/12.
        $this->assertCount(1, $result['cards']);
        $this->assertSame('Cartão Azul', $result['nearest']['card_name']);
        $this->assertSame(5, $result['nearest']['closing_day']);
        $this->assertSame('2026-12-05', $result['nearest']['next_due_date']);
        $this->assertSame(20, $result['nearest']['days_until_due']);

        $this->assertSame(['cards' => [], 'nearest' => null], app(UpcomingCardClosingsQuery::class)->get($this->user->id + 999));
    }

    public function test_invoice_months_with_bills(): void
    {
        $result = app(InvoiceMonthsQuery::class)->get($this->user->id, []);

        $this->assertSame('2026-11', $result['current_month_key']);

        $groups = collect($result['monthly_groups'])->keyBy('month_key');
        // Outubro quitado; recorrente projeta até 11/2027.
        $this->assertTrue($groups['2026-10']['is_paid']);
        $this->assertEqualsWithDelta(220.0, $groups['2026-10']['total_spent'], 0.001);
        $this->assertEqualsWithDelta(270.0, $groups['2026-11']['total_spent'], 0.001);
        $this->assertEqualsWithDelta(180.0, $groups['2026-12']['total_spent'], 0.001); // 100 + 50 + 30
        $this->assertSame('2027-11', $groups->keys()->last());

        // Aluguel 1500 + Luz variável pela média de 110 e 130.
        $bills = $groups['2026-11']['bills_data'];
        $this->assertSame(1620.0, $bills['total']);
        $this->assertSame([1500.0, 120.0], array_column($bills['items'], 'amount'));
        $this->assertSame([false, true], array_column($bills['items'], 'is_variable'));
        $this->assertSame([null, 2], array_column($bills['items'], 'avg_count'));

        $this->assertSame(8, $this->countTransactions($this->user->id));
    }

    /**
     * @param  list<array<string, mixed>>  $categories
     * @return array<string, float>
     */
    private function totals(array $categories): array
    {
        return array_column($categories, 'total', 'category_name');
    }

    private function countTransactions(int $userId): int
    {
        return app(InvoiceMonthsQuery::class)->transactions($userId, [])->count();
    }
}

<?php

namespace Tests\Feature\Queries;

use App\Queries\ResumoMensal\CategoryAveragesQuery;
use App\Queries\ResumoMensal\ExpenseCalendarQuery;
use App\Queries\ResumoMensal\ExpensesByBankQuery;
use App\Queries\ResumoMensal\ExpensesByCardQuery;
use App\Queries\ResumoMensal\ExpensesByCategoryQuery;
use App\Queries\ResumoMensal\MonthIncomesQuery;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\FinanceScenario;
use Tests\TestCase;

/**
 * Cada Query do Resumo mensal sobre o cenário de FinanceScenario, no mês de
 * novembro de 2026 (e outubro onde o contraste ajuda).
 */
class ResumoMensalQueriesTest extends TestCase
{
    use FinanceScenario;
    use RefreshDatabase;

    private Carbon $november;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedFinanceScenario();
        $this->november = Carbon::parse('2026-11-01');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_month_incomes(): void
    {
        $incomes = app(MonthIncomesQuery::class)->get($this->user->id, $this->november);

        $this->assertSame(['Salário', 'Pix recebido'], array_column($incomes, 'title'));
        $this->assertSame([5000.0, 300.0], array_column($incomes, 'amount'));
        $this->assertSame(['Dia 5', '12/11/2026'], array_column($incomes, 'payment_day_label'));
        $this->assertSame([true, false], array_column($incomes, 'is_recurring'));

        // Em outubro o pix (recebido em novembro) não aparece.
        $october = app(MonthIncomesQuery::class)->get($this->user->id, Carbon::parse('2026-10-01'));
        $this->assertSame(['Salário'], array_column($october, 'title'));
    }

    public function test_expenses_by_category(): void
    {
        $rows = app(ExpensesByCategoryQuery::class)->get($this->user->id, $this->november);

        // Mercado: açougue 40 + 2ª parcela 100 + feira 30; Lazer: bar 80 + streaming 50.
        $this->assertSame(['Mercado', 'Lazer', 'Sem categoria'], array_column($rows, 'category_name'));
        $this->assertSame([170.0, 130.0, 90.0], array_column($rows, 'total'));
        $this->assertSame([3, 2, 1], array_column($rows, 'count'));

        // Outubro: padaria 200 + 1ª parcela 100 (Mercado), cinema 120 (Lazer).
        $october = app(ExpensesByCategoryQuery::class)->get($this->user->id, Carbon::parse('2026-10-01'));
        $this->assertSame([300.0, 120.0], array_column($october, 'total'));
    }

    public function test_calendar(): void
    {
        $days = app(ExpenseCalendarQuery::class)->get($this->user->id, $this->november);

        $this->assertCount(30, $days);
        $this->assertSame('2026-11-01', $days[0]['date']);
        $this->assertSame(0, $days[0]['weekday']); // 01/11/2026 é domingo

        $busy = collect($days)->filter(fn ($d) => $d['count'] > 0)->mapWithKeys(fn ($d) => [$d['day'] => $d['total']])->all();
        // Compra no cartão entra pela parcela do mês: a feira (60 em 2x) aparece com 30.
        $this->assertSame([3 => 90.0, 7 => 30.0, 8 => 80.0, 10 => 40.0], $busy);

        $feira = $days[6]['transactions'][0];
        $this->assertSame('credit', $feira['type']);
        $this->assertSame('unpaid', $feira['status']);
    }

    public function test_expenses_by_card(): void
    {
        $cards = app(ExpensesByCardQuery::class)->get($this->user->id, $this->november);

        // A feira não tem cartão e fica de fora: 100 + 90 + 50 = 240.
        $this->assertCount(1, $cards);
        $this->assertSame('Cartão Azul', $cards[0]['card_name']);
        $this->assertSame(240.0, $cards[0]['total']);
        $this->assertSame(['MercadoX3', 'Farmacia', 'Streaming'], array_column($cards[0]['transactions'], 'title'));
        $this->assertSame(['2/3', null, null], array_column($cards[0]['transactions'], 'installments'));
        $this->assertSame([300.0, 90.0, 50.0], array_column($cards[0]['transactions'], 'total_amount'));
    }

    public function test_expenses_by_bank(): void
    {
        // Novembro: bar e açougue sem conta.
        $november = app(ExpensesByBankQuery::class)->get($this->user->id, $this->november);
        $this->assertSame([['Sem banco', 120.0, 2]], array_map(fn ($g) => [$g['bank_name'], $g['total'], $g['count']], $november));
        $this->assertSame(['Bar', 'Acougue'], array_column($november[0]['transactions'], 'title'));

        // Outubro: a padaria foi lançada no cartão.
        $october = app(ExpensesByBankQuery::class)->get($this->user->id, Carbon::parse('2026-10-01'));
        $this->assertSame([['Cartão Azul', 200.0, 1]], array_map(fn ($g) => [$g['bank_name'], $g['total'], $g['count']], $october));
    }

    public function test_category_averages(): void
    {
        $rows = app(CategoryAveragesQuery::class)->get($this->user->id, $this->november);

        // Janela agosto a novembro, sempre dividida por 4.
        // Mercado: 200 + 40 + 100 + 100 + 30 = 470 -> média 117,50; novembro 170.
        // Lazer: 120 + 80 + 50 = 250 -> média 62,50; novembro 130.
        // Sem categoria: 90 -> média 22,50; novembro 90.
        $this->assertSame(['Mercado', 'Lazer', 'Sem categoria'], array_column($rows, 'category_name'));
        $this->assertSame([170.0, 130.0, 90.0], array_column($rows, 'current_total'));
        $this->assertSame([117.5, 62.5, 22.5], array_column($rows, 'average'));
        $this->assertSame([52.5, 67.5, 67.5], array_column($rows, 'diff'));
        $this->assertSame([44.7, 108.0, 300.0], array_column($rows, 'diff_percent'));
    }
}

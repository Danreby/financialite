<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\FinanceScenario;
use Tests\TestCase;

/**
 * Projeção de 6 meses (GET /api/v1/projections) sobre o cenário fixo
 * (ver FinanceScenario; "hoje" é 15/11/2026).
 *
 * Contas feitas à mão, só com compras no crédito (débito não entra):
 *
 * | Compra     | Parcela | Faturas              | Entra na projeção? |
 * |------------|---------|----------------------|--------------------|
 * | mercadoX3  | 100,00  | 2026-10, 11, 12      | sim (nov e dez)    |
 * | cinema     | 120,00  | 2026-10              | não (já terminou)  |
 * | streaming  |  50,00  | 2026-11 em diante    | sim, todo mês      |
 * | farmacia   |  90,00  | 2026-11              | sim (só nov)       |
 * | feiraX2    |  30,00  | 2026-11, 12          | sim (nov e dez)    |
 *
 * nov = 100 + 50 + 90 + 30 = 270; dez = 100 + 50 + 30 = 180; jan a abr = 50.
 * Receita recorrente: só o salário (5000,00); o pix avulso não entra.
 * Débito do mês: bar 80,00 + açougue 40,00 = 120,00 (a padaria é de outubro).
 */
class ProjectionsApiTest extends TestCase
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

    public function test_six_month_projection_matches_hand_computed_numbers(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/projections')->assertOk();

        $this->assertEqualsWithDelta(120.0, (float) $response->json('current_month_debit'), 0.001);
        $this->assertEqualsWithDelta(5000.0, (float) $response->json('monthly_recurring_income'), 0.001);

        $months = collect($response->json('projected_months'));
        $this->assertSame(
            ['2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04'],
            $months->pluck('month')->all()
        );
        $this->assertEqualsWithDelta(
            [270.0, 180.0, 50.0, 50.0, 50.0, 50.0],
            $months->pluck('projected_debit')->map(fn ($v) => (float) $v)->all(),
            0.001
        );
        $this->assertEqualsWithDelta(
            [5000.0, 5000.0, 5000.0, 5000.0, 5000.0, 5000.0],
            $months->pluck('projected_income')->map(fn ($v) => (float) $v)->all(),
            0.001
        );
    }

    public function test_transactions_list_has_the_open_credit_purchases_only(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/projections')->assertOk();

        $titles = collect($response->json('transactions'))->pluck('title')->sort()->values()->all();

        // cinema terminou em outubro e os débitos não são projetados.
        $this->assertSame(['Farmacia', 'FeiraX2', 'MercadoX3', 'Streaming'], $titles);
    }

    public function test_remaining_installments_count_from_the_current_month(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/projections')->assertOk();

        $remaining = collect($response->json('transactions'))->pluck('remaining_installments', 'title')->all();

        // mercadoX3 já cobrou outubro (1 de 3); feiraX2 ainda tem nov e dez; streaming é recorrente.
        $this->assertSame(1, $remaining['Farmacia']);
        $this->assertNull($remaining['Streaming']);

        $this->assertSame(2, $remaining['MercadoX3']);
        $this->assertSame(2, $remaining['FeiraX2']);
    }

    public function test_other_users_data_is_not_projected(): void
    {
        $other = User::factory()->create();

        $response = $this->actingAs($other, 'sanctum')->getJson('/api/v1/projections')->assertOk();

        $this->assertSame([], $response->json('transactions'));
        $this->assertEqualsWithDelta(0.0, (float) $response->json('current_month_debit'), 0.001);
        $this->assertEqualsWithDelta(0.0, (float) $response->json('projected_months.0.projected_debit'), 0.001);
    }
}

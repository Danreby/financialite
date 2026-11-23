<?php

namespace Tests\Feature;

use App\Models\Transacao;
use App\Models\User;
use App\Services\DashboardInsightsService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SpendingTrendsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function debit(User $user, float $amount, string $date): void
    {
        Transacao::factory()->debit()->create([
            'user_id' => $user->id,
            'amount' => $amount,
            'created_at' => Carbon::parse($date),
        ]);
    }

    public function test_three_month_average_uses_the_three_previous_full_months(): void
    {
        Carbon::setTestNow('2026-11-15 10:00:00');
        $user = User::factory()->create();

        $this->debit($user, 9000, '2026-07-20'); // fora da janela
        $this->debit($user, 3000, '2026-08-10');
        $this->debit($user, 1000, '2026-09-10');
        $this->debit($user, 2000, '2026-10-10');
        $this->debit($user, 500, '2026-11-05'); // mês atual, fora da média

        $trends = app(DashboardInsightsService::class)->getInsights($user)['spending_trends'];

        $this->assertTrue($trends['has_data']);
        $this->assertEqualsWithDelta(500.0, $trends['current_month'], 0.001);
        $this->assertEqualsWithDelta(2000.0, $trends['previous_month'], 0.001);
        $this->assertEqualsWithDelta(2000.0, $trends['three_month_avg'], 0.001);
    }

    public function test_three_month_average_never_exceeds_the_largest_month(): void
    {
        Carbon::setTestNow('2026-11-15 10:00:00');
        $user = User::factory()->create();

        $this->debit($user, 1500, '2026-09-03');
        $this->debit($user, 1500, '2026-10-03');
        $this->debit($user, 1500, '2026-11-03');

        $trends = app(DashboardInsightsService::class)->getInsights($user)['spending_trends'];

        // Agosto sem gasto: (0 + 1500 + 1500) / 3.
        $this->assertEqualsWithDelta(1000.0, $trends['three_month_avg'], 0.001);
    }

    public function test_windows_do_not_overflow_on_the_last_day_of_a_long_month(): void
    {
        // Em 31/12, "um mês atrás" com transbordo cairia em 01/12 e puxaria o mês atual.
        Carbon::setTestNow('2026-12-31 10:00:00');
        $user = User::factory()->create();

        $this->debit($user, 900, '2026-09-30'); // fora da janela
        $this->debit($user, 3000, '2026-10-15');
        $this->debit($user, 600, '2026-11-20');
        $this->debit($user, 400, '2026-12-10'); // mês atual

        $trends = app(DashboardInsightsService::class)->getInsights($user)['spending_trends'];

        $this->assertEqualsWithDelta(400.0, $trends['current_month'], 0.001);
        $this->assertEqualsWithDelta(600.0, $trends['previous_month'], 0.001);
        // Janela: setembro, outubro e novembro.
        $this->assertEqualsWithDelta((900 + 3000 + 600) / 3, $trends['three_month_avg'], 0.001);
    }

    public function test_windows_do_not_overflow_on_march_31(): void
    {
        Carbon::setTestNow('2026-03-31 10:00:00');
        $user = User::factory()->create();

        $this->debit($user, 1200, '2026-02-27');
        $this->debit($user, 300, '2026-03-05'); // mês atual

        $trends = app(DashboardInsightsService::class)->getInsights($user)['spending_trends'];

        $this->assertEqualsWithDelta(300.0, $trends['current_month'], 0.001);
        $this->assertEqualsWithDelta(1200.0, $trends['previous_month'], 0.001);
        // Janela: dezembro, janeiro e fevereiro.
        $this->assertEqualsWithDelta(400.0, $trends['three_month_avg'], 0.001);
    }
}

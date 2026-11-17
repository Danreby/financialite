<?php

namespace Tests\Feature;

use App\Models\SavingsGoal;
use App\Models\User;
use App\Services\SavingsGoalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SavingsGoalLockTest extends TestCase
{
    use RefreshDatabase;

    private function makeGoal(float $current): SavingsGoal
    {
        $user = User::factory()->create();
        $goal = new SavingsGoal([
            'title' => 'Viagem',
            'target_amount' => 1000,
            'current_amount' => $current,
        ]);
        $goal->user_id = $user->id;
        $goal->save();

        return $goal;
    }

    public function test_deposit_uses_the_current_database_balance_not_a_stale_instance(): void
    {
        $goal = $this->makeGoal(100);

        // Outra requisição já depositou enquanto esta instância estava em memória.
        SavingsGoal::whereKey($goal->id)->update(['current_amount' => 200]);

        $result = app(SavingsGoalService::class)->deposit($goal, 50);

        $this->assertEquals(250.0, (float) $result->current_amount);
        $this->assertEquals(250.0, (float) SavingsGoal::find($goal->id)->current_amount);
    }

    public function test_withdraw_uses_the_current_database_balance_not_a_stale_instance(): void
    {
        $goal = $this->makeGoal(100);
        SavingsGoal::whereKey($goal->id)->update(['current_amount' => 200]);

        $result = app(SavingsGoalService::class)->withdraw($goal, 50);

        $this->assertEquals(150.0, (float) $result->current_amount);
    }

    public function test_deposit_is_capped_at_target_and_completes_goal(): void
    {
        $goal = $this->makeGoal(990.10);

        $result = app(SavingsGoalService::class)->deposit($goal, 20.20);

        $this->assertEquals(1000.0, (float) $result->current_amount);
        $this->assertNotNull($result->completed_at);
    }

    public function test_cents_do_not_drift_on_repeated_deposits(): void
    {
        $goal = $this->makeGoal(0);
        $service = app(SavingsGoalService::class);

        foreach (range(1, 10) as $i) {
            $service->deposit($goal, 0.10);
        }

        $this->assertSame('1.00', SavingsGoal::find($goal->id)->current_amount);
    }

    public function test_withdraw_never_goes_below_zero_and_reopens_completed_goal(): void
    {
        $goal = $this->makeGoal(1000);
        $service = app(SavingsGoalService::class);
        $service->deposit($goal, 1);

        $result = $service->withdraw($goal, 5000);

        $this->assertEquals(0.0, (float) $result->current_amount);
        $this->assertNull($result->completed_at);
    }
}

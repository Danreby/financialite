<?php

namespace Tests\Feature;

use App\Models\SavingsGoal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Web (/savings) e API (/api/v1/savings) chamam as mesmas Actions de meta.
 */
class SavingsGoalActionsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    /** @return array<string, array{0: string}> */
    public static function sides(): array
    {
        return ['web' => ['web'], 'api' => ['api']];
    }

    private function as(string $side, ?User $user = null): static
    {
        return $this->actingAs($user ?? $this->user, $side === 'api' ? 'sanctum' : 'web');
    }

    private function url(string $side, string $path = ''): string
    {
        return ($side === 'api' ? '/api/v1/savings' : '/savings').$path;
    }

    private function goal(?User $owner = null, string $current = '100.00'): SavingsGoal
    {
        $goal = new SavingsGoal(['title' => 'Viagem', 'target_amount' => '1000.00', 'current_amount' => $current]);
        $goal->user_id = ($owner ?? $this->user)->id;
        $goal->save();

        return $goal;
    }

    #[DataProvider('sides')]
    public function test_create_goal(string $side): void
    {
        $this->as($side)->postJson($this->url($side), [
            'title' => 'Reserva',
            'target_amount' => '5000.00',
        ])->assertCreated()
            ->assertJsonPath('title', 'Reserva')
            ->assertJsonPath('user_id', $this->user->id);

        $goal = SavingsGoal::firstOrFail();
        $this->assertTrue((bool) $goal->is_active);
        $this->assertSame('0.00', (string) $goal->current_amount);
    }

    #[DataProvider('sides')]
    public function test_update_goal(string $side): void
    {
        $goal = $this->goal();

        $this->as($side)->putJson($this->url($side, '/'.$goal->id), ['title' => 'Viagem longa', 'target_amount' => '2000.00'])
            ->assertOk()
            ->assertJsonPath('title', 'Viagem longa');
    }

    #[DataProvider('sides')]
    public function test_deposit_and_withdraw(string $side): void
    {
        $goal = $this->goal();

        $this->as($side)->postJson($this->url($side, '/'.$goal->id.'/deposit'), ['amount' => '50.25'])
            ->assertOk()
            ->assertJsonPath('current_amount', '150.25');

        $this->as($side)->postJson($this->url($side, '/'.$goal->id.'/withdraw'), ['amount' => '0.25'])
            ->assertOk()
            ->assertJsonPath('current_amount', '150.00');
    }

    #[DataProvider('sides')]
    public function test_withdraw_above_balance_returns_422(string $side): void
    {
        $goal = $this->goal();

        $this->as($side)->postJson($this->url($side, '/'.$goal->id.'/withdraw'), ['amount' => '100.01'])
            ->assertStatus(422)
            ->assertExactJson(['error' => 'Valor de retirada excede o saldo disponível.']);

        $this->assertSame('100.00', (string) $goal->refresh()->current_amount);
    }

    #[DataProvider('sides')]
    public function test_delete_goal(string $side): void
    {
        $goal = $this->goal();

        $this->as($side)->deleteJson($this->url($side, '/'.$goal->id))
            ->assertOk()
            ->assertExactJson(['message' => 'Meta removida.']);

        $this->assertSoftDeleted($goal);
    }

    #[DataProvider('sides')]
    public function test_other_users_goal_returns_404(string $side): void
    {
        $goal = $this->goal(User::factory()->create());

        $this->as($side)->putJson($this->url($side, '/'.$goal->id), ['title' => 'hackeado'])->assertNotFound();
        $this->as($side)->postJson($this->url($side, '/'.$goal->id.'/deposit'), ['amount' => '10'])->assertNotFound();
        $this->as($side)->postJson($this->url($side, '/'.$goal->id.'/withdraw'), ['amount' => '10'])->assertNotFound();
        $this->as($side)->deleteJson($this->url($side, '/'.$goal->id))->assertNotFound();

        $goal->refresh();
        $this->assertSame('Viagem', $goal->title);
        $this->assertSame('100.00', (string) $goal->current_amount);
        $this->assertNotSoftDeleted($goal);
    }

    #[DataProvider('sides')]
    public function test_summary(string $side): void
    {
        $this->goal();

        $this->as($side)->getJson($this->url($side, '/summary'))
            ->assertOk()
            ->assertJsonPath('total_saved', 100)
            ->assertJsonPath('total_target', 1000)
            ->assertJsonPath('goals_count', 1);
    }
}

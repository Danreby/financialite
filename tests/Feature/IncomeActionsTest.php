<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\BankLedgerEntry;
use App\Models\BankUser;
use App\Models\Income;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Web (/incomes) e API (/api/v1/incomes) chamam as mesmas Actions de receita.
 */
class IncomeActionsTest extends TestCase
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
        return ($side === 'api' ? '/api/v1/incomes' : '/incomes').$path;
    }

    private function income(?User $owner = null): Income
    {
        $income = new Income([
            'title' => 'Salário',
            'amount' => '3000.00',
            'type' => 'salary',
            'is_recurring' => true,
            'is_active' => true,
            'auto_deposit' => true,
            'payment_day_type' => 'fixed',
            'payment_day_value' => 5,
        ]);
        $income->user_id = ($owner ?? $this->user)->id;
        $income->save();

        return $income;
    }

    #[DataProvider('sides')]
    public function test_create_recurring_income(string $side): void
    {
        $response = $this->as($side)->postJson($this->url($side), [
            'title' => 'Salário',
            'amount' => '3000.00',
            'type' => 'salary',
            'is_recurring' => true,
            'payment_day_type' => 'fixed',
            'payment_day_value' => 5,
        ])->assertCreated()
            ->assertJsonPath('title', 'Salário')
            ->assertJsonPath('user_id', $this->user->id);

        if ($side === 'web') {
            $response->assertJsonPath('bank_user', null);
        }

        $income = Income::firstOrFail();
        $this->assertTrue($income->is_active);
        $this->assertTrue($income->auto_deposit);
    }

    #[DataProvider('sides')]
    public function test_one_off_income_credits_the_chosen_account(string $side): void
    {
        $account = BankUser::create([
            'bank_id' => Bank::create(['name' => 'Banco Teste'])->id,
            'user_id' => $this->user->id,
            'balance' => 0,
        ]);

        $this->as($side)->postJson($this->url($side), [
            'title' => 'Freela',
            'amount' => '250.75',
            'type' => 'freelance',
            'is_recurring' => false,
            'bank_account_id' => $account->id,
        ])->assertCreated();

        $this->assertSame('250.75', $account->refresh()->balance);
        $this->assertSame(1, BankLedgerEntry::where('bank_user_id', $account->id)->where('type', BankLedgerEntry::TYPE_INCOME_CREDIT)->count());
    }

    #[DataProvider('sides')]
    public function test_update_income(string $side): void
    {
        $income = $this->income();

        $this->as($side)->putJson($this->url($side, '/'.$income->id), [
            'title' => 'Salário novo',
            'amount' => '3500.00',
            'type' => 'salary',
            'is_recurring' => true,
            'payment_day_type' => 'fixed',
            'payment_day_value' => 10,
        ])->assertOk()
            ->assertJsonPath('title', 'Salário novo')
            ->assertJsonPath('payment_day_value', 10);
    }

    #[DataProvider('sides')]
    public function test_toggle_active_and_auto_deposit(string $side): void
    {
        $income = $this->income();
        $method = $side === 'api' ? 'patchJson' : 'postJson';

        $this->as($side)->{$method}($this->url($side, '/'.$income->id.'/toggle'))
            ->assertOk()
            ->assertJsonPath('is_active', false);

        $this->as($side)->{$method}($this->url($side, '/'.$income->id.'/toggle-auto-deposit'))
            ->assertOk()
            ->assertJsonPath('auto_deposit', false);
    }

    #[DataProvider('sides')]
    public function test_delete_income(string $side): void
    {
        $income = $this->income();
        $message = $side === 'web' ? 'Renda removida.' : 'Receita removida.';

        $this->as($side)->deleteJson($this->url($side, '/'.$income->id))
            ->assertOk()
            ->assertExactJson(['message' => $message]);

        $this->assertSoftDeleted($income);
    }

    #[DataProvider('sides')]
    public function test_other_users_income_returns_404(string $side): void
    {
        $income = $this->income(User::factory()->create());
        $method = $side === 'api' ? 'patchJson' : 'postJson';

        $this->as($side)->putJson($this->url($side, '/'.$income->id), [
            'title' => 'hackeado',
            'amount' => '1.00',
            'type' => 'salary',
            'is_recurring' => true,
            'payment_day_type' => 'fixed',
            'payment_day_value' => 1,
        ])->assertNotFound();
        $this->as($side)->{$method}($this->url($side, '/'.$income->id.'/toggle'))->assertNotFound();
        $this->as($side)->{$method}($this->url($side, '/'.$income->id.'/toggle-auto-deposit'))->assertNotFound();
        $this->as($side)->deleteJson($this->url($side, '/'.$income->id))->assertNotFound();

        $income->refresh();
        $this->assertSame('Salário', $income->title);
        $this->assertTrue($income->is_active);
        $this->assertTrue($income->auto_deposit);
        $this->assertNotSoftDeleted($income);
    }

    #[DataProvider('sides')]
    public function test_summary(string $side): void
    {
        $this->income();

        $this->as($side)->getJson($this->url($side, '/summary'))
            ->assertOk()
            ->assertExactJson(['total_monthly_income' => 3000]);
    }
}

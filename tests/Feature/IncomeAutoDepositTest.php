<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\BankLedgerEntry;
use App\Models\BankUser;
use App\Models\Income;
use App\Models\User;
use App\Services\IncomeService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IncomeAutoDepositTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected BankUser $bankUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $bank = Bank::create(['name' => 'Banco Teste']);

        $this->bankUser = BankUser::create([
            'bank_id' => $bank->id,
            'user_id' => $this->user->id,
            'balance' => 0,
        ]);
    }

    private function makeIncome(array $overrides = []): Income
    {
        $income = new Income(array_merge([
            'title' => 'Renda',
            'amount' => 1000,
            'type' => 'salary',
            'is_recurring' => true,
            'is_active' => true,
            'auto_deposit' => true,
            'payment_day_type' => 'fixed',
            'payment_day_value' => 5,
        ], $overrides));
        $income->user_id = $this->user->id;
        $income->save();

        return $income;
    }

    public function test_recurring_income_defaults_auto_deposit_to_true(): void
    {
        $income = app(IncomeService::class)->createForUser($this->user, [
            'title' => 'Salário',
            'amount' => 3000,
            'type' => 'salary',
            'is_recurring' => true,
            'payment_day_type' => 'fixed',
            'payment_day_value' => 5,
            'bank_account_id' => $this->bankUser->id,
        ]);

        $this->assertTrue((bool) $income->auto_deposit);
    }

    public function test_toggle_auto_deposit_flips_the_value(): void
    {
        $income = $this->makeIncome([
            'title' => 'Salário',
            'amount' => 3000,
            'type' => 'salary',
            'payment_day_value' => 5,
            'bank_account_id' => $this->bankUser->id,
        ]);

        $updated = app(IncomeService::class)->toggleAutoDeposit($income);
        $this->assertFalse((bool) $updated->auto_deposit);

        $updated = app(IncomeService::class)->toggleAutoDeposit($updated);
        $this->assertTrue((bool) $updated->auto_deposit);
    }

    public function test_credit_command_skips_incomes_with_auto_deposit_disabled(): void
    {
        $today = Carbon::today();

        $enabled = $this->makeIncome([
            'title' => 'Salário',
            'amount' => 3000,
            'type' => 'salary',
            'payment_day_value' => $today->day,
            'bank_account_id' => $this->bankUser->id,
        ]);

        $disabledBankUser = BankUser::create([
            'bank_id' => Bank::create(['name' => 'Banco Teste 2'])->id,
            'user_id' => $this->user->id,
            'balance' => 0,
        ]);

        $disabled = $this->makeIncome([
            'title' => 'Freela',
            'amount' => 500,
            'type' => 'freelance',
            'auto_deposit' => false,
            'payment_day_value' => $today->day,
            'bank_account_id' => $disabledBankUser->id,
        ]);

        $this->artisan('incomes:credit-to-bank')->assertExitCode(0);

        $this->assertEquals(3000.0, (float) $this->bankUser->fresh()->balance);
        $this->assertEquals(0.0, (float) $disabledBankUser->fresh()->balance);

        $this->assertNotNull($enabled->fresh()->received_at);
        $this->assertNull($disabled->fresh()->received_at);

        $this->assertCount(1, BankLedgerEntry::forBankUser($this->bankUser->id)->get());
        $this->assertCount(0, BankLedgerEntry::forBankUser($disabledBankUser->id)->get());
    }
}

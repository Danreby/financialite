<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\BankLedgerEntry;
use App\Models\BankTransfer;
use App\Models\BankUser;
use App\Models\User;
use App\Services\BankLedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Web (/bank-accounts, /bank-transfers) e API (/api/v1/bank-accounts, /api/v1/bank-transfers)
 * chamam as mesmas Actions de conta bancária e transferência.
 */
class BankActionsTest extends TestCase
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

    private function url(string $side, string $path): string
    {
        return ($side === 'api' ? '/api/v1' : '').$path;
    }

    private function account(string $balance = '0', ?User $owner = null, string $bank = 'Banco A'): BankUser
    {
        $account = BankUser::create([
            'bank_id' => Bank::create(['name' => $bank])->id,
            'user_id' => ($owner ?? $this->user)->id,
            'balance' => 0,
        ]);
        if ($balance !== '0') {
            app(BankLedgerService::class)->record($account, BankLedgerEntry::TYPE_ACCOUNT_OPENING, $balance);
        }

        return $account->refresh();
    }

    #[DataProvider('sides')]
    public function test_create_account_with_initial_balance(string $side): void
    {
        $bank = Bank::create(['name' => 'Banco Novo']);

        $this->as($side)->postJson($this->url($side, '/bank-accounts'), ['bank_id' => $bank->id, 'balance' => '150.35'])
            ->assertCreated()
            ->assertJsonPath('bank_id', $bank->id)
            ->assertJsonPath('user_id', $this->user->id);

        $this->assertSame('150.35', BankUser::firstOrFail()->balance);
    }

    #[DataProvider('sides')]
    public function test_duplicate_bank_is_refused(string $side): void
    {
        $account = $this->account();

        $response = $this->as($side)->postJson($this->url($side, '/bank-accounts'), ['bank_id' => $account->bank_id]);

        // Comportamento herdado: a web traduz o DomainException em 422, a API em 500.
        if ($side === 'web') {
            $response->assertStatus(422)->assertJsonPath('error', 'Você já possui uma conta no banco "Banco A".');
        } else {
            $response->assertStatus(500)->assertExactJson(['error' => 'Erro ao criar conta bancária.']);
        }
        $this->assertSame(1, BankUser::count());
    }

    #[DataProvider('sides')]
    public function test_update_balance_records_adjustment_in_cents(string $side): void
    {
        $account = $this->account('100.10');

        $this->as($side)->putJson($this->url($side, '/bank-accounts/'.$account->id), ['balance' => '80.05'])
            ->assertOk()
            ->assertJsonPath('balance', '80.05');

        $adjustment = BankLedgerEntry::where('bank_user_id', $account->id)
            ->where('type', BankLedgerEntry::TYPE_MANUAL_ADJUSTMENT)
            ->firstOrFail();
        $this->assertSame('-20.05', $adjustment->amount);
    }

    #[DataProvider('sides')]
    public function test_delete_account(string $side): void
    {
        $account = $this->account();

        $this->as($side)->deleteJson($this->url($side, '/bank-accounts/'.$account->id))
            ->assertOk()
            ->assertExactJson(['message' => 'Conta bancária removida.']);
    }

    #[DataProvider('sides')]
    public function test_transfer(string $side): void
    {
        $from = $this->account('100.00');
        $to = $this->account('0', null, 'Banco B');

        $this->as($side)->postJson($this->url($side, '/bank-transfers'), [
            'from_bank_user_id' => $from->id,
            'to_bank_user_id' => $to->id,
            'amount' => '40.50',
        ])->assertCreated()->assertJsonPath('amount', '40.50');

        $this->assertSame('59.50', $from->refresh()->balance);
        $this->assertSame('40.50', $to->refresh()->balance);
    }

    #[DataProvider('sides')]
    public function test_transfer_with_insufficient_balance_is_refused(string $side): void
    {
        $from = $this->account('10.00');
        $to = $this->account('0', null, 'Banco B');

        // Comportamento herdado: os dois lados devolvem 500 com mensagem genérica.
        $this->as($side)->postJson($this->url($side, '/bank-transfers'), [
            'from_bank_user_id' => $from->id,
            'to_bank_user_id' => $to->id,
            'amount' => '40.50',
        ])->assertStatus(500)->assertExactJson(['error' => 'Erro ao realizar transferência.']);

        $this->assertSame(0, BankTransfer::count());
        $this->assertSame('10.00', $from->refresh()->balance);
    }

    #[DataProvider('sides')]
    public function test_other_users_account_returns_404(string $side): void
    {
        $account = $this->account('50.00', User::factory()->create());

        $this->as($side)->getJson($this->url($side, '/bank-accounts/'.$account->id))->assertNotFound();
        $this->as($side)->getJson($this->url($side, '/bank-accounts/'.$account->id.'/ledger'))->assertNotFound();
        $this->as($side)->putJson($this->url($side, '/bank-accounts/'.$account->id), ['balance' => '1'])->assertNotFound();
        $this->as($side)->deleteJson($this->url($side, '/bank-accounts/'.$account->id))->assertNotFound();

        $this->assertSame('50.00', $account->refresh()->balance);
    }
}

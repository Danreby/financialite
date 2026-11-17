<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\BankLedgerEntry;
use App\Models\BankTransfer;
use App\Models\BankUser;
use App\Models\User;
use App\Services\BankLedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BankAccountDeletionTest extends TestCase
{
    use RefreshDatabase;

    private const MESSAGE = 'Esta conta tem movimentações. Arquive em vez de excluir.';

    private User $user;

    private BankUser $account;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->account = BankUser::create([
            'bank_id' => Bank::create(['name' => 'Banco Teste'])->id,
            'user_id' => $this->user->id,
        ]);
    }

    public function test_account_without_movements_can_be_deleted(): void
    {
        $this->actingAs($this->user)
            ->deleteJson(route('bank-accounts.destroy', $this->account->id))
            ->assertOk();

        $this->assertNull(BankUser::find($this->account->id));
    }

    public function test_web_delete_is_blocked_when_account_has_ledger_entries(): void
    {
        app(BankLedgerService::class)->record($this->account, BankLedgerEntry::TYPE_ACCOUNT_OPENING, 50);

        $this->actingAs($this->user)
            ->deleteJson(route('bank-accounts.destroy', $this->account->id))
            ->assertStatus(422)
            ->assertJsonPath('error', self::MESSAGE);

        $this->assertNotNull(BankUser::find($this->account->id));
        $this->assertSame(1, BankLedgerEntry::where('bank_user_id', $this->account->id)->count());
    }

    public function test_api_delete_is_blocked_when_account_has_ledger_entries(): void
    {
        app(BankLedgerService::class)->record($this->account, BankLedgerEntry::TYPE_ACCOUNT_OPENING, 50);
        Sanctum::actingAs($this->user);

        $this->deleteJson("/api/v1/bank-accounts/{$this->account->id}")
            ->assertStatus(422)
            ->assertJsonPath('error', self::MESSAGE);

        $this->assertNotNull(BankUser::find($this->account->id));
    }

    public function test_delete_is_blocked_when_account_has_a_transfer(): void
    {
        $other = BankUser::create([
            'bank_id' => Bank::create(['name' => 'Outro'])->id,
            'user_id' => $this->user->id,
        ]);
        BankTransfer::create([
            'user_id' => $this->user->id,
            'from_bank_user_id' => $other->id,
            'to_bank_user_id' => $this->account->id,
            'amount' => 10,
        ]);

        $this->actingAs($this->user)
            ->deleteJson(route('bank-accounts.destroy', $this->account->id))
            ->assertStatus(422)
            ->assertJsonPath('error', self::MESSAGE);
    }

    public function test_cannot_delete_another_users_account(): void
    {
        $other = User::factory()->create();

        $this->actingAs($other)
            ->deleteJson(route('bank-accounts.destroy', $this->account->id))
            ->assertNotFound();

        $this->assertNotNull(BankUser::find($this->account->id));
    }
}

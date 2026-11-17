<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\BankLedgerEntry;
use App\Models\BankTransfer;
use App\Models\BankUser;
use App\Models\Card;
use App\Models\CardUser;
use App\Models\Fatura;
use App\Models\User;
use App\Services\BankLedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BankAccountDeletionTest extends TestCase
{
    use RefreshDatabase;

    private const MESSAGE = 'Esta conta tem movimentações e não pode ser excluída.';

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

    public function test_account_with_only_opening_balance_and_adjustment_can_be_deleted(): void
    {
        app(BankLedgerService::class)->record($this->account, BankLedgerEntry::TYPE_ACCOUNT_OPENING, 50);
        app(BankLedgerService::class)->record($this->account, BankLedgerEntry::TYPE_MANUAL_ADJUSTMENT, -10);

        $this->actingAs($this->user)
            ->deleteJson(route('bank-accounts.destroy', $this->account->id))
            ->assertOk();

        $this->assertNull(BankUser::find($this->account->id));
        $this->assertSame(0, BankLedgerEntry::where('bank_user_id', $this->account->id)->count());
    }

    public function test_account_created_with_initial_balance_can_be_deleted(): void
    {
        $this->actingAs($this->user)
            ->postJson(route('bank-accounts.store'), [
                'bank_id' => Bank::create(['name' => 'Banco Novo'])->id,
                'balance' => 120.5,
            ])
            ->assertSuccessful();

        $created = BankUser::where('user_id', $this->user->id)->latest('id')->firstOrFail();
        $this->assertNotSame($this->account->id, $created->id);
        $this->assertSame(1, BankLedgerEntry::where('bank_user_id', $created->id)->count());

        $this->actingAs($this->user)
            ->deleteJson(route('bank-accounts.destroy', $created->id))
            ->assertOk();

        $this->assertNull(BankUser::find($created->id));
    }

    public function test_account_whose_id_matches_another_users_card_fatura_can_be_deleted(): void
    {
        $other = User::factory()->create();
        $cardUser = new CardUser([
            'card_id' => Card::create(['name' => 'Cartão de outro'])->id,
            'user_id' => $other->id,
        ]);
        $cardUser->id = $this->account->id;
        $cardUser->save();
        Fatura::create([
            'user_id' => $other->id,
            'month_key' => now()->format('Y-m'),
            'bank_user_id' => $cardUser->id,
            'total_paid' => 10,
        ]);

        $this->actingAs($this->user)
            ->deleteJson(route('bank-accounts.destroy', $this->account->id))
            ->assertOk();

        $this->assertNull(BankUser::find($this->account->id));
    }

    public function test_web_delete_is_blocked_when_account_has_income_deposit(): void
    {
        app(BankLedgerService::class)->record($this->account, BankLedgerEntry::TYPE_INCOME_CREDIT, 50);

        $this->actingAs($this->user)
            ->deleteJson(route('bank-accounts.destroy', $this->account->id))
            ->assertStatus(422)
            ->assertJsonPath('error', self::MESSAGE);

        $this->assertNotNull(BankUser::find($this->account->id));
        $this->assertSame(1, BankLedgerEntry::where('bank_user_id', $this->account->id)->count());
    }

    public function test_api_delete_is_blocked_when_account_has_fatura_debit(): void
    {
        app(BankLedgerService::class)->record($this->account, BankLedgerEntry::TYPE_ACCOUNT_OPENING, 50);
        app(BankLedgerService::class)->record($this->account, BankLedgerEntry::TYPE_INVOICE_PAYMENT, -20);
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

<?php

namespace Tests\Feature;

use App\Actions\Transacao\ResolvePaymentAccounts;
use App\Models\Bank;
use App\Models\BankLedgerEntry;
use App\Models\BankUser;
use App\Models\Card;
use App\Models\CardUser;
use App\Models\Transacao;
use App\Models\User;
use App\Services\BankLedgerService;
use App\Services\FaturaService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Web (rotas /transacoes) e API (/api/v1/transacoes) chamam as mesmas Actions.
 * Cada cenário roda nos dois lados e confere status e formato da resposta.
 */
class TransacaoActionsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private CardUser $cardUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->cardUser = CardUser::create([
            'card_id' => Card::create(['name' => 'Cartão Teste'])->id,
            'user_id' => $this->user->id,
        ]);
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
        return ($side === 'api' ? '/api/v1/transacoes' : '/transacoes').$path;
    }

    private function account(string $balance): BankUser
    {
        $account = BankUser::create([
            'bank_id' => Bank::create(['name' => 'Banco Teste'])->id,
            'user_id' => $this->user->id,
            'balance' => 0,
        ]);
        app(BankLedgerService::class)->record($account, BankLedgerEntry::TYPE_ACCOUNT_OPENING, $balance);

        return $account->refresh();
    }

    private function purchase(string $amount, ?User $owner = null): Transacao
    {
        return Transacao::create([
            'title' => 'Compra teste',
            'amount' => $amount,
            'type' => 'credit',
            'status' => 'unpaid',
            'total_installments' => 1,
            'current_installment' => 0,
            'is_recurring' => false,
            'user_id' => ($owner ?? $this->user)->id,
            'bank_user_id' => $owner ? null : $this->cardUser->id,
        ]);
    }

    #[DataProvider('sides')]
    public function test_create_transacao(string $side): void
    {
        $response = $this->as($side)->postJson($this->url($side), [
            'title' => 'Notebook',
            'amount' => '100.00',
            'type' => 'credit',
            'total_installments' => 3,
            'bank_user_id' => $this->cardUser->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('title', 'Notebook')
            ->assertJsonPath('bank_user.id', $this->cardUser->id);

        if ($side === 'web') {
            $response->assertJsonPath('user.id', $this->user->id)->assertJsonCount(3, 'parcelas');
        } else {
            $response->assertJsonStructure(['category']);
        }

        $this->assertSame(['33.34', '33.33', '33.33'], Transacao::first()->parcelas()->orderBy('installment_number')->pluck('amount')->all());
    }

    #[DataProvider('sides')]
    public function test_debit_purchase_is_capped_by_locked_balance(string $side): void
    {
        $account = $this->account('50.00');

        foreach (['30.00', '30.00'] as $amount) {
            $this->as($side)->postJson($this->url($side), [
                'title' => 'Mercado',
                'amount' => $amount,
                'type' => 'debit',
                'debit_account_id' => $account->id,
            ])->assertCreated();
        }

        $this->assertSame('0.00', $account->refresh()->balance);
        $debits = BankLedgerEntry::where('bank_user_id', $account->id)
            ->where('type', BankLedgerEntry::TYPE_DEBIT_PURCHASE)
            ->orderBy('id')
            ->pluck('amount')
            ->all();
        $this->assertSame(['-30.00', '-20.00'], $debits);
    }

    #[DataProvider('sides')]
    public function test_update_transacao(string $side): void
    {
        $tx = $this->purchase('10.00');

        $this->as($side)->putJson($this->url($side, '/'.$tx->id), ['title' => 'Novo título', 'amount' => '25.50'])
            ->assertOk()
            ->assertJsonPath('title', 'Novo título')
            ->assertJsonPath('amount', '25.50');

        $this->assertSame('25.50', $tx->parcelas()->value('amount'));
    }

    #[DataProvider('sides')]
    public function test_delete_and_restore_transacao(string $side): void
    {
        $tx = $this->purchase('10.00');
        [$removed, $restored, $notRemoved, $key] = $side === 'web'
            ? ['Fatura removida.', 'Fatura restaurada.', 'Fatura não está removida.', 'fatura']
            : ['Transação removida.', 'Transação restaurada.', 'Transação não está removida.', 'transacao'];

        $this->as($side)->deleteJson($this->url($side, '/'.$tx->id))
            ->assertOk()
            ->assertExactJson(['message' => $removed]);
        $this->assertSoftDeleted($tx);

        $this->as($side)->postJson($this->url($side, '/'.$tx->id.'/restore'))
            ->assertOk()
            ->assertJsonPath('message', $restored)
            ->assertJsonPath($key.'.id', $tx->id);
        $this->assertNotSoftDeleted($tx);

        $this->as($side)->postJson($this->url($side, '/'.$tx->id.'/restore'))
            ->assertStatus(400)
            ->assertExactJson(['error' => $notRemoved]);
    }

    #[DataProvider('sides')]
    public function test_other_users_transacao_returns_404(string $side): void
    {
        $other = User::factory()->create();
        $tx = $this->purchase('10.00', $other);

        $this->as($side)->getJson($this->url($side, '/'.$tx->id))->assertNotFound();
        $this->as($side)->putJson($this->url($side, '/'.$tx->id), ['title' => 'hackeado'])->assertNotFound();
        $this->as($side)->deleteJson($this->url($side, '/'.$tx->id))->assertNotFound();

        $tx->delete();
        $this->as($side)->postJson($this->url($side, '/'.$tx->id.'/restore'))->assertNotFound();

        $this->assertSame('Compra teste', Transacao::withTrashed()->find($tx->id)->title);
        $this->assertSoftDeleted($tx);
    }

    #[DataProvider('sides')]
    public function test_show_own_transacao(string $side): void
    {
        $tx = $this->purchase('10.00');

        $this->as($side)->getJson($this->url($side, '/'.$tx->id))
            ->assertOk()
            ->assertJsonPath('id', $tx->id)
            ->assertJsonStructure(['bank_user' => ['card'], 'anexos', 'parcelas']);
    }

    #[DataProvider('sides')]
    public function test_pay_month(string $side): void
    {
        $account = $this->account('100.00');
        $this->purchase('40.00');
        $month = now()->format('Y-m');

        $response = $this->as($side)->postJson($this->url($side, '/pay-month'), [
            'month' => $month,
            'bank_user_id' => $this->cardUser->id,
            'bank_account_id' => $account->id,
        ])->assertOk()->assertJsonPath('message', 'Pagamentos registrados com sucesso.');

        if ($side === 'api') {
            $response->assertJsonPath('total_paid', 40);
        } else {
            $response->assertExactJson(['message' => 'Pagamentos registrados com sucesso.']);
        }

        $this->assertSame('60.00', $account->refresh()->balance);

        $empty = $side === 'web' ? 'Nenhuma fatura pendente para este mês.' : 'Nenhuma transação pendente para este mês.';
        $this->as($side)->postJson($this->url($side, '/pay-month'), [
            'month' => $month,
            'bank_user_id' => $this->cardUser->id,
            'bank_account_id' => $account->id,
        ])->assertOk()->assertExactJson(['message' => $empty]);

        $this->assertSame('60.00', $account->refresh()->balance);
    }

    #[DataProvider('sides')]
    public function test_pay_month_with_insufficient_balance_returns_422(string $side): void
    {
        $account = $this->account('10.00');
        $this->purchase('40.00');

        $this->as($side)->postJson($this->url($side, '/pay-month'), [
            'month' => now()->format('Y-m'),
            'bank_user_id' => $this->cardUser->id,
            'bank_account_id' => $account->id,
        ])->assertStatus(422)->assertJsonStructure(['error']);

        $this->assertSame('10.00', $account->refresh()->balance);
    }

    public function test_pay_partial_on_web(): void
    {
        $account = $this->account('100.00');
        $this->purchase('40.00');

        $this->as('web')->postJson('/transacoes/pay-partial', [
            'month' => now()->format('Y-m'),
            'amount' => '15.50',
            'bank_user_id' => $this->cardUser->id,
            'bank_account_id' => $account->id,
        ])->assertOk()->assertExactJson([
            'message' => 'Pagamento parcial registrado com sucesso.',
            'total_paid' => 15.5,
            'total_due' => 40,
            'amount_paid_now' => 15.5,
            'is_fully_paid' => false,
        ]);

        $this->assertSame('84.50', $account->refresh()->balance);
    }

    public function test_pay_partial_domain_error_returns_422(): void
    {
        $this->as('web')->postJson('/transacoes/pay-partial', [
            'month' => now()->format('Y-m'),
            'amount' => '15.50',
        ])->assertStatus(422)->assertExactJson(['error' => 'Nenhuma transação encontrada para este mês.']);
    }

    public function test_transactions_list_page_props(): void
    {
        $this->purchase('10.00');

        $this->as('web')->get(route('transactions.index', ['order' => 'amount_desc']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Transacao')
                ->has('transactions.data', 1)
                ->where('transactions.data.0.amount', 10)
                ->where('filterTotals.total_count', 1)
                ->where('filterTotals.credit_total', 10)
                ->where('filters.order', 'amount_desc')
                ->has('bankAccounts', 1)
                ->has('categories')
                ->has('months', 1));
    }

    public function test_installments_page_props(): void
    {
        $tx = $this->purchase('100.00');
        $tx->update(['total_installments' => 3]);
        $tx->parcelas()->delete();
        app(FaturaService::class)->createParcelas($tx->refresh());

        $this->as('web')->get(route('parcelamentos.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Parcelamentos')
                ->has('installments', 1)
                ->where('installments.0.total_installments', 3)
                ->where('installments.0.installment_amount', 33.34)
                ->has('installments.0.parcelas', 3)
                ->has('bankAccounts', 1)
                ->has('categories'));
    }

    /**
     * Cartão ou conta de outro usuário nunca chega à Action: a FormRequest recusa com 422
     * (exists com user_id). A Action, chamada direto, responde 404 (ModelNotFoundException).
     */
    #[DataProvider('sides')]
    public function test_foreign_card_on_create_is_rejected(string $side): void
    {
        $other = User::factory()->create();
        $foreignCard = CardUser::create(['card_id' => Card::create(['name' => 'Alheio'])->id, 'user_id' => $other->id]);

        $this->as($side)->postJson($this->url($side), [
            'title' => 'Notebook',
            'amount' => '100.00',
            'type' => 'credit',
            'bank_user_id' => $foreignCard->id,
        ])->assertStatus(422)->assertJsonValidationErrors('bank_user_id');

        $this->assertSame(0, Transacao::count());
    }

    #[DataProvider('sides')]
    public function test_foreign_card_or_account_on_pay_month_is_rejected(string $side): void
    {
        $other = User::factory()->create();
        $foreignCard = CardUser::create(['card_id' => Card::create(['name' => 'Alheio'])->id, 'user_id' => $other->id]);
        $foreignAccount = BankUser::create(['bank_id' => Bank::create(['name' => 'Banco Alheio'])->id, 'user_id' => $other->id, 'balance' => 0]);
        $account = $this->account('100.00');
        $this->purchase('40.00');

        $this->as($side)->postJson($this->url($side, '/pay-month'), [
            'month' => now()->format('Y-m'),
            'bank_user_id' => $foreignCard->id,
            'bank_account_id' => $account->id,
        ])->assertStatus(422)->assertJsonValidationErrors('bank_user_id');

        $this->as($side)->postJson($this->url($side, '/pay-month'), [
            'month' => now()->format('Y-m'),
            'bank_user_id' => $this->cardUser->id,
            'bank_account_id' => $foreignAccount->id,
        ])->assertStatus(422)->assertJsonValidationErrors('bank_account_id');

        $this->assertSame('100.00', $account->refresh()->balance);
    }

    public function test_payment_account_resolver_returns_404_for_foreign_ids(): void
    {
        $other = User::factory()->create();
        $foreignCard = CardUser::create(['card_id' => Card::create(['name' => 'Alheio'])->id, 'user_id' => $other->id]);
        $foreignAccount = BankUser::create(['bank_id' => Bank::create(['name' => 'Banco Alheio'])->id, 'user_id' => $other->id, 'balance' => 0]);
        $resolver = app(ResolvePaymentAccounts::class);

        [$card, $account] = $resolver->handle($this->user, ['bank_user_id' => $this->cardUser->id]);
        $this->assertSame($this->cardUser->id, $card->id);
        $this->assertNull($account);

        foreach ([['bank_user_id' => $foreignCard->id], ['bank_account_id' => $foreignAccount->id]] as $data) {
            try {
                $resolver->handle($this->user, $data);
                $this->fail('Esperava ModelNotFoundException para '.json_encode($data));
            } catch (ModelNotFoundException) {
                $this->addToAssertionCount(1);
            }
        }
    }
}

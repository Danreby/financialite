<?php

namespace Tests\Feature;

use App\Exceptions\InsufficientBalanceException;
use App\Models\Bank;
use App\Models\BankLedgerEntry;
use App\Models\BankUser;
use App\Models\Card;
use App\Models\CardUser;
use App\Models\Fatura;
use App\Models\FaturaPaymentEvent;
use App\Models\Transacao;
use App\Models\User;
use App\Services\BankLedgerService;
use App\Services\FaturaPaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FaturaPaymentTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private BankUser $account;

    private CardUser $cardUser;

    private string $monthKey;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->account = BankUser::create([
            'bank_id' => Bank::create(['name' => 'Banco Teste'])->id,
            'user_id' => $this->user->id,
            'balance' => 0,
        ]);
        $this->cardUser = CardUser::create([
            'card_id' => Card::create(['name' => 'Cartão Teste'])->id,
            'user_id' => $this->user->id,
        ]);
        $this->monthKey = now()->format('Y-m');
    }

    private function fund(float $amount): void
    {
        app(BankLedgerService::class)->record($this->account, BankLedgerEntry::TYPE_ACCOUNT_OPENING, $amount);
    }

    private function purchase(float $amount): Transacao
    {
        return Transacao::create([
            'title' => 'Compra teste',
            'amount' => $amount,
            'type' => 'credit',
            'status' => 'unpaid',
            'total_installments' => 1,
            'current_installment' => 0,
            'is_recurring' => false,
            'user_id' => $this->user->id,
            'bank_user_id' => $this->cardUser->id,
        ]);
    }

    private function service(): FaturaPaymentService
    {
        return app(FaturaPaymentService::class);
    }

    public function test_paying_same_month_twice_debits_once(): void
    {
        $this->fund(200);
        $this->purchase(150);

        $first = $this->service()->payMonthForUser($this->user, $this->monthKey, $this->cardUser, $this->account);
        $second = $this->service()->payMonthForUser($this->user, $this->monthKey, $this->cardUser, $this->account);

        $this->assertEquals(150.0, $first);
        $this->assertEquals(0.0, $second);
        $this->assertEquals(50.0, (float) $this->account->fresh()->balance);
        $this->assertSame(1, FaturaPaymentEvent::count());
        $this->assertSame(1, BankLedgerEntry::where('type', BankLedgerEntry::TYPE_INVOICE_PAYMENT)->count());
    }

    public function test_insufficient_balance_throws_and_changes_nothing(): void
    {
        $this->fund(50);
        $transacao = $this->purchase(120);

        try {
            $this->service()->payMonthForUser($this->user, $this->monthKey, $this->cardUser, $this->account);
            $this->fail('Deveria lançar InsufficientBalanceException.');
        } catch (InsufficientBalanceException $e) {
            $this->assertStringContainsString('Saldo insuficiente na conta', $e->getMessage());
            $this->assertStringContainsString('70,00', $e->getMessage());
        }

        $this->assertEquals(50.0, (float) $this->account->fresh()->balance);
        $this->assertNotSame('paid', $transacao->fresh()->status);
        $this->assertSame(0, FaturaPaymentEvent::count());
        $this->assertSame(0, Fatura::count());
        $this->assertSame(1, BankLedgerEntry::count());
    }

    public function test_partial_payment_cannot_exceed_remaining(): void
    {
        $this->fund(200);
        $this->purchase(150);

        $first = $this->service()->payPartialForUser($this->user, $this->monthKey, 100.0, $this->cardUser, $this->account);
        $this->assertEquals(100.0, $first['amount_paid_now']);

        $second = $this->service()->payPartialForUser($this->user, $this->monthKey, 100.0, $this->cardUser, $this->account);
        $this->assertEquals(50.0, $second['amount_paid_now']);
        $this->assertEquals(150.0, $second['total_paid']);
        $this->assertTrue($second['is_fully_paid']);
        $this->assertEquals(50.0, (float) $this->account->fresh()->balance);

        $this->expectException(\DomainException::class);
        $this->service()->payPartialForUser($this->user, $this->monthKey, 10.0, $this->cardUser, $this->account);
    }

    public function test_partial_payment_with_insufficient_balance_throws_and_changes_nothing(): void
    {
        $this->fund(30);
        $this->purchase(150);

        try {
            $this->service()->payPartialForUser($this->user, $this->monthKey, 100.0, $this->cardUser, $this->account);
            $this->fail('Deveria lançar InsufficientBalanceException.');
        } catch (InsufficientBalanceException $e) {
            $this->assertStringContainsString('70,00', $e->getMessage());
        }

        $this->assertEquals(30.0, (float) $this->account->fresh()->balance);
        $this->assertSame(0, FaturaPaymentEvent::count());
    }
}

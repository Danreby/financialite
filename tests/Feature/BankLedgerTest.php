<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\BankLedgerEntry;
use App\Models\BankTransfer;
use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Fatura;
use App\Models\FaturaPaymentEvent;
use App\Models\Transacao;
use App\Models\User;
use App\Services\BankAccountService;
use App\Services\BankLedgerService;
use App\Services\BankTransferService;
use App\Services\FaturaLedgerService;
use App\Services\FaturaPaymentService;
use App\Services\FaturaService;
use App\Services\IncomeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BankLedgerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected BankUser $bankUser1;

    protected BankUser $bankUser2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();

        $bank = Bank::create(['name' => 'Banco Teste']);

        $this->bankUser1 = BankUser::create([
            'bank_id' => $bank->id,
            'user_id' => $this->user->id,
            'balance' => 0,
        ]);

        $this->bankUser2 = BankUser::create([
            'bank_id' => Bank::create(['name' => 'Banco Teste 2'])->id,
            'user_id' => $this->user->id,
            'balance' => 0,
        ]);
    }

    public function test_income_credit_increases_balance_and_creates_ledger_entry(): void
    {
        $incomeService = app(IncomeService::class);

        $incomeService->createForUser($this->user, [
            'title' => 'Freela',
            'amount' => 500,
            'type' => 'freelance',
            'is_recurring' => false,
            'bank_account_id' => $this->bankUser1->id,
        ]);

        $this->bankUser1->refresh();
        $this->assertEquals(500.0, (float) $this->bankUser1->balance);

        $entries = BankLedgerEntry::forBankUser($this->bankUser1->id)->get();
        $this->assertCount(1, $entries);
        $this->assertEquals(BankLedgerEntry::TYPE_INCOME_CREDIT, $entries->first()->type);
        $this->assertEquals(500.0, (float) $entries->first()->amount);
        $this->assertEquals(500.0, (float) $entries->first()->balance_after);
    }

    public function test_transfer_moves_money_between_two_accounts_and_creates_two_entries(): void
    {
        app(BankLedgerService::class)->record($this->bankUser1, BankLedgerEntry::TYPE_ACCOUNT_OPENING, 300);

        $transfer = app(BankTransferService::class)->transfer($this->user, [
            'from_bank_user_id' => $this->bankUser1->id,
            'to_bank_user_id' => $this->bankUser2->id,
            'amount' => 100,
        ]);

        $this->assertInstanceOf(BankTransfer::class, $transfer);
        $this->assertEquals(200.0, (float) $this->bankUser1->fresh()->balance);
        $this->assertEquals(100.0, (float) $this->bankUser2->fresh()->balance);

        $outEntry = BankLedgerEntry::forBankUser($this->bankUser1->id)
            ->where('type', BankLedgerEntry::TYPE_TRANSFER_OUT)->first();
        $inEntry = BankLedgerEntry::forBankUser($this->bankUser2->id)
            ->where('type', BankLedgerEntry::TYPE_TRANSFER_IN)->first();

        $this->assertNotNull($outEntry);
        $this->assertNotNull($inEntry);
        $this->assertEquals(-100.0, (float) $outEntry->amount);
        $this->assertEquals(100.0, (float) $inEntry->amount);
        $this->assertEquals(BankTransfer::class, $outEntry->source_type);
        $this->assertEquals($transfer->id, $outEntry->source_id);
    }

    public function test_invoice_payment_debits_balance_and_updates_fatura_total_paid(): void
    {
        app(BankLedgerService::class)->record($this->bankUser1, BankLedgerEntry::TYPE_ACCOUNT_OPENING, 200);

        $cardUser = CardUser::create([
            'card_id' => \App\Models\Card::create(['name' => 'Cartão Teste'])->id,
            'user_id' => $this->user->id,
        ]);

        $monthKey = now()->format('Y-m');

        Transacao::create([
            'title' => 'Compra teste',
            'amount' => 150,
            'type' => 'credit',
            'status' => 'unpaid',
            'total_installments' => 1,
            'current_installment' => 0,
            'is_recurring' => false,
            'user_id' => $this->user->id,
            'bank_user_id' => $cardUser->id,
        ]);

        $paidAmount = app(FaturaPaymentService::class)->payMonthForUser(
            $this->user,
            $monthKey,
            $cardUser,
            $this->bankUser1
        );

        $this->assertEquals(150.0, $paidAmount);
        $this->assertEquals(50.0, (float) $this->bankUser1->fresh()->balance);

        $fatura = Fatura::where([
            'user_id' => $this->user->id,
            'month_key' => $monthKey,
            'bank_user_id' => $cardUser->id,
        ])->first();

        $this->assertNotNull($fatura);
        $this->assertEquals(150.0, (float) $fatura->total_paid);
        $this->assertNotNull($fatura->paid_at);

        $paymentEvent = FaturaPaymentEvent::forFatura($fatura->id)->first();
        $this->assertNotNull($paymentEvent);
        $this->assertEquals(FaturaPaymentEvent::TYPE_PAYMENT, $paymentEvent->type);
        $this->assertEquals(150.0, (float) $paymentEvent->amount);
        $this->assertNotNull($paymentEvent->bank_ledger_entry_id);

        $ledgerEntry = BankLedgerEntry::forBankUser($this->bankUser1->id)
            ->where('type', BankLedgerEntry::TYPE_INVOICE_PAYMENT)->first();
        $this->assertNotNull($ledgerEntry);
        $this->assertEquals(-150.0, (float) $ledgerEntry->amount);
        $this->assertEquals(Fatura::class, $ledgerEntry->source_type);
        $this->assertEquals($fatura->id, $ledgerEntry->source_id);
    }

    public function test_manual_adjustment_add_and_subtract_generate_correct_delta(): void
    {
        app(BankLedgerService::class)->record($this->bankUser1, BankLedgerEntry::TYPE_ACCOUNT_OPENING, 100);

        $service = app(BankAccountService::class);

        $service->updateBalance($this->bankUser1, 250);
        $this->assertEquals(250.0, (float) $this->bankUser1->fresh()->balance);

        $addEntry = BankLedgerEntry::forBankUser($this->bankUser1->id)
            ->where('type', BankLedgerEntry::TYPE_MANUAL_ADJUSTMENT)->first();
        $this->assertEquals(150.0, (float) $addEntry->amount);

        $service->updateBalance($this->bankUser1->fresh(), 180);
        $this->assertEquals(180.0, (float) $this->bankUser1->fresh()->balance);

        $subtractEntry = BankLedgerEntry::forBankUser($this->bankUser1->id)
            ->where('type', BankLedgerEntry::TYPE_MANUAL_ADJUSTMENT)
            ->orderByDesc('id')
            ->first();
        $this->assertEquals(-70.0, (float) $subtractEntry->amount);
    }

    public function test_reopening_paid_transacao_reverses_total_paid_without_touching_bank_balance(): void
    {
        $cardUser = CardUser::create([
            'card_id' => \App\Models\Card::create(['name' => 'Cartão Teste'])->id,
            'user_id' => $this->user->id,
        ]);

        $monthKey = now()->format('Y-m');

        $transacao = Transacao::create([
            'title' => 'Compra paga',
            'amount' => 150,
            'type' => 'credit',
            'status' => 'paid',
            'paid_date' => now(),
            'total_installments' => 1,
            'current_installment' => 1,
            'is_recurring' => false,
            'user_id' => $this->user->id,
            'bank_user_id' => $cardUser->id,
        ]);

        $fatura = Fatura::create([
            'user_id' => $this->user->id,
            'month_key' => $monthKey,
            'bank_user_id' => $cardUser->id,
            'total_paid' => 0,
            'paid_at' => now(),
        ]);

        app(FaturaLedgerService::class)->recordPaymentEvent(
            $fatura,
            150,
            FaturaPaymentEvent::TYPE_PAYMENT,
            null,
            null,
            'Pagamento simulado'
        );

        $fatura->refresh();
        $this->assertEquals(150.0, (float) $fatura->total_paid);

        $ledgerCountBefore = BankLedgerEntry::count();

        app(FaturaService::class)->updateForUser($transacao, ['paid_date' => null]);

        $fatura->refresh();
        $this->assertEquals(0.0, (float) $fatura->total_paid);
        $this->assertNull($fatura->paid_at);

        $this->assertEquals($ledgerCountBefore, BankLedgerEntry::count());

        $events = FaturaPaymentEvent::forFatura($fatura->id)->orderBy('id')->get();
        $this->assertCount(2, $events);
        $this->assertEquals(FaturaPaymentEvent::TYPE_REVERSAL, $events->last()->type);
    }

    public function test_rebuild_balance_matches_live_balance_after_a_sequence_of_operations(): void
    {
        $ledger = app(BankLedgerService::class);

        $ledger->record($this->bankUser1, BankLedgerEntry::TYPE_ACCOUNT_OPENING, 1000);

        app(BankTransferService::class)->transfer($this->user, [
            'from_bank_user_id' => $this->bankUser1->id,
            'to_bank_user_id' => $this->bankUser2->id,
            'amount' => 200,
        ]);

        $ledger->record($this->bankUser1->fresh(), BankLedgerEntry::TYPE_INCOME_CREDIT, 50);
        $ledger->record($this->bankUser1->fresh(), BankLedgerEntry::TYPE_MANUAL_ADJUSTMENT, -30);

        $liveBalance = (float) $this->bankUser1->fresh()->balance;
        $this->assertEquals(820.0, $liveBalance);

        $rebuilt = $ledger->rebuildBalance($this->bankUser1);

        $this->assertEquals($liveBalance, (float) $rebuilt->balance);
    }
}

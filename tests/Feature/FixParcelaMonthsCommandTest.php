<?php

namespace Tests\Feature;

use App\Models\Card;
use App\Models\CardUser;
use App\Models\Transacao;
use App\Models\TransacaoParcela;
use App\Models\User;
use App\Services\FaturaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FixParcelaMonthsCommandTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private CardUser $card;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->card = CardUser::create([
            'card_id' => Card::create(['name' => 'Cartão Teste'])->id,
            'user_id' => $this->user->id,
            'closing_day' => 10,
            'due_day' => 17,
        ]);
    }

    /**
     * Cria uma compra parcelada e grava as parcelas como o código antigo fazia:
     * em 30/01, depois do fechamento, a primeira parcela caía em março.
     */
    private function purchaseWithWrongMonths(string $status = 'pending'): Transacao
    {
        $transacao = Transacao::factory()->credit()->create([
            'user_id' => $this->user->id,
            'bank_user_id' => $this->card->id,
            'title' => 'Notebook',
            'amount' => 300,
            'status' => 'unpaid',
            'total_installments' => 3,
            'is_recurring' => false,
            'created_at' => '2027-01-30 14:00:00',
        ]);

        $transacao->parcelas()->delete();
        foreach ([1 => '2027-03', 2 => '2027-04', 3 => '2027-05'] as $n => $month) {
            TransacaoParcela::create([
                'transacao_id' => $transacao->id,
                'installment_number' => $n,
                'amount' => 100,
                'due_date' => $month.'-17',
                'month_key' => $month,
                'status' => $n === 1 ? $status : 'pending',
                'paid_date' => $n === 1 && $status === 'paid' ? '2027-03-17' : null,
            ]);
        }

        return $transacao;
    }

    public function test_dry_run_reports_without_changing_anything(): void
    {
        $transacao = $this->purchaseWithWrongMonths();

        $this->artisan('parcelas:corrigir-meses')
            ->expectsOutputToContain('Notebook')
            ->expectsOutputToContain('Nada foi alterado')
            ->assertSuccessful();

        $this->assertSame('2027-03', $transacao->parcelas()->where('installment_number', 1)->value('month_key'));
    }

    public function test_apply_moves_unpaid_installments_to_the_right_months(): void
    {
        $transacao = $this->purchaseWithWrongMonths();

        $this->artisan('parcelas:corrigir-meses', ['--apply' => true])->assertSuccessful();

        $parcelas = $transacao->parcelas()->orderBy('installment_number')->get();
        $this->assertSame(['2027-02', '2027-03', '2027-04'], $parcelas->pluck('month_key')->all());
        $this->assertSame('2027-02-17', $parcelas[0]->due_date->toDateString());
        $this->assertSame('2027-04-17', $parcelas[2]->due_date->toDateString());
        $this->assertEqualsWithDelta(300.0, (float) $parcelas->sum('amount'), 0.001);
    }

    public function test_apply_skips_purchases_with_paid_installments(): void
    {
        $transacao = $this->purchaseWithWrongMonths('paid');

        $this->artisan('parcelas:corrigir-meses', ['--apply' => true])
            ->expectsOutputToContain('revisar manualmente')
            ->assertSuccessful();

        $this->assertSame('2027-03', $transacao->parcelas()->where('installment_number', 1)->value('month_key'));
    }

    public function test_single_installment_purchase_gets_the_right_billing_month(): void
    {
        $transacao = Transacao::factory()->credit()->create([
            'user_id' => $this->user->id,
            'bank_user_id' => $this->card->id,
            'title' => 'Jantar',
            'amount' => 120,
            'status' => 'unpaid',
            'total_installments' => 1,
            'is_recurring' => false,
            'created_at' => '2027-01-31 21:00:00',
        ]);
        $transacao->parcelas()->delete();
        TransacaoParcela::create([
            'transacao_id' => $transacao->id,
            'installment_number' => 1,
            'amount' => 120,
            'due_date' => '2027-01-31',
            'month_key' => '2027-03',
            'status' => 'pending',
        ]);

        $this->artisan('parcelas:corrigir-meses', ['--apply' => true])->assertSuccessful();

        $parcela = $transacao->parcelas()->first();
        $this->assertSame('2027-02', $parcela->month_key);
        $this->assertSame('2027-01-31', $parcela->due_date->toDateString());
    }

    public function test_correct_purchases_are_left_alone(): void
    {
        $transacao = Transacao::factory()->credit()->create([
            'user_id' => $this->user->id,
            'bank_user_id' => $this->card->id,
            'title' => 'Fone',
            'amount' => 200,
            'status' => 'unpaid',
            'total_installments' => 2,
            'is_recurring' => false,
            'created_at' => '2027-01-05 10:00:00',
        ]);
        $transacao->parcelas()->delete();
        app(FaturaService::class)->createParcelas($transacao->fresh());
        $snapshot = fn () => $transacao->parcelas()->orderBy('installment_number')->get()
            ->map(fn ($p) => [$p->id, $p->month_key, $p->due_date->toDateString(), (string) $p->updated_at])
            ->all();
        $before = $snapshot();

        $this->artisan('parcelas:corrigir-meses', ['--apply' => true])
            ->expectsOutputToContain('0 compra(s)')
            ->assertSuccessful();

        $this->assertSame($before, $snapshot());
        $this->assertSame('2027-01', $before[0][1]);
    }
}

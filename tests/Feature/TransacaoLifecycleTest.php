<?php

namespace Tests\Feature;

use App\Models\Card;
use App\Models\CardUser;
use App\Models\Transacao;
use App\Models\User;
use App\Services\FaturaBillingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Criação, edição e recorrência de compras no crédito, com parcelas conferidas
 * à mão. Cartão com fechamento no dia 5: compra feita a partir do dia 5 cai na
 * fatura do mês seguinte. "Hoje" é 20/09/2026, então a compra de 100,00 em 3x
 * vai para as faturas 2026-10, 2026-11 e 2026-12 (33,34 + 33,33 + 33,33).
 */
class TransacaoLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private CardUser $card;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-09-20 12:00:00');
        $this->user = User::factory()->create();
        $this->card = CardUser::create([
            'card_id' => Card::create(['name' => 'Cartão Azul'])->id,
            'user_id' => $this->user->id,
            'closing_day' => 5,
            'due_day' => 12,
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    /** @return array<string, array{0: string}> */
    public static function sides(): array
    {
        return ['web' => ['web'], 'api' => ['api']];
    }

    private function as(string $side): static
    {
        return $this->actingAs($this->user, $side === 'api' ? 'sanctum' : 'web');
    }

    private function url(string $side, string $path = ''): string
    {
        return ($side === 'api' ? '/api/v1/transacoes' : '/transacoes').$path;
    }

    /** @param array<string, mixed> $extra */
    private function create(string $side, array $extra = []): Transacao
    {
        $id = $this->as($side)->postJson($this->url($side), array_merge([
            'title' => 'Notebook',
            'amount' => '100.00',
            'type' => 'credit',
            'total_installments' => 3,
            'bank_user_id' => $this->card->id,
        ], $extra))->assertSuccessful()->json('id');

        return Transacao::findOrFail($id);
    }

    /** @return list<array{0: int, 1: string, 2: string}> [número, mês da fatura, valor] */
    private function schedule(Transacao $transacao): array
    {
        return $transacao->parcelas()->orderBy('installment_number')->get()
            ->map(fn ($p) => [$p->installment_number, $p->month_key, (string) $p->amount])
            ->all();
    }

    #[DataProvider('sides')]
    public function test_creating_a_3x_purchase_builds_the_schedule_from_the_closing_day(string $side): void
    {
        $transacao = $this->create($side);

        $this->assertSame(
            [[1, '2026-10', '33.34'], [2, '2026-11', '33.33'], [3, '2026-12', '33.33']],
            $this->schedule($transacao)
        );
    }

    #[DataProvider('sides')]
    public function test_purchase_before_closing_day_goes_to_the_current_month_invoice(string $side): void
    {
        Carbon::setTestNow('2026-09-04 12:00:00');

        $transacao = $this->create($side, ['total_installments' => 2, 'amount' => '50.00']);

        $this->assertSame([[1, '2026-09', '25.00'], [2, '2026-10', '25.00']], $this->schedule($transacao));
    }

    #[DataProvider('sides')]
    public function test_reducing_installments_rebuilds_the_schedule(string $side): void
    {
        $transacao = $this->create($side);

        $this->as($side)->putJson($this->url($side, '/'.$transacao->id), ['total_installments' => 2])->assertOk();

        $this->assertSame([[1, '2026-10', '50.00'], [2, '2026-11', '50.00']], $this->schedule($transacao));
    }

    #[DataProvider('sides')]
    public function test_changing_the_amount_rebuilds_the_schedule(string $side): void
    {
        $transacao = $this->create($side);

        $this->as($side)->putJson($this->url($side, '/'.$transacao->id), ['amount' => '90.00'])->assertOk();

        $this->assertSame(
            [[1, '2026-10', '30.00'], [2, '2026-11', '30.00'], [3, '2026-12', '30.00']],
            $this->schedule($transacao)
        );
    }

    #[DataProvider('sides')]
    public function test_editing_only_the_title_keeps_the_same_parcelas(string $side): void
    {
        $transacao = $this->create($side);
        $idsBefore = $transacao->parcelas()->orderBy('installment_number')->pluck('id')->all();

        $this->as($side)->putJson($this->url($side, '/'.$transacao->id), ['title' => 'Notebook novo'])->assertOk();

        $this->assertSame('Notebook novo', $transacao->refresh()->title);
        $this->assertSame($idsBefore, $transacao->parcelas()->orderBy('installment_number')->pluck('id')->all());
    }

    #[DataProvider('sides')]
    public function test_marking_as_recurring_drops_installments_and_parcelas(string $side): void
    {
        $transacao = $this->create($side);

        $this->as($side)->putJson($this->url($side, '/'.$transacao->id), ['is_recurring' => true])->assertOk();

        $transacao->refresh();
        $this->assertTrue($transacao->is_recurring);
        $this->assertSame(1, (int) $transacao->total_installments);
        $this->assertSame(0, (int) $transacao->current_installment);
        $this->assertNull($transacao->paid_date);
        // Compra recorrente não tem parcelas: ela é cobrada todo mês a partir da fatura de 2026-10.
        $this->assertSame([], $this->schedule($transacao));
    }

    #[DataProvider('sides')]
    public function test_creating_a_recurring_purchase_has_no_parcelas_and_starts_next_invoice(string $side): void
    {
        $transacao = $this->create($side, ['title' => 'Streaming', 'amount' => '50.00', 'total_installments' => 1, 'is_recurring' => true]);

        $this->assertTrue($transacao->is_recurring);
        $this->assertSame([], $this->schedule($transacao));
        $this->assertSame('2026-10', app(FaturaBillingService::class)->resolveBillingMonthKey($transacao));
    }

    #[DataProvider('sides')]
    public function test_installments_above_360_are_rejected(string $side): void
    {
        $this->as($side)->postJson($this->url($side), [
            'title' => 'Eterna', 'amount' => '10.00', 'type' => 'credit', 'total_installments' => 361,
        ])->assertStatus(422)->assertJsonValidationErrors('total_installments');

        $this->assertSame(0, Transacao::count());
    }
}

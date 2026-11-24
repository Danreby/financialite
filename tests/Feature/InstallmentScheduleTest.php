<?php

namespace Tests\Feature;

use App\Models\Card;
use App\Models\CardUser;
use App\Models\Transacao;
use App\Models\User;
use App\Services\FaturaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstallmentScheduleTest extends TestCase
{
    use RefreshDatabase;

    private function purchase(string $amount, int $installments): Transacao
    {
        $user = User::factory()->create();
        $card = CardUser::create([
            'card_id' => Card::create(['name' => 'Cartão Teste'])->id,
            'user_id' => $user->id,
            'closing_day' => 10,
            'due_day' => 17,
        ]);

        return Transacao::factory()->credit()->create([
            'user_id' => $user->id,
            'bank_user_id' => $card->id,
            'title' => 'Compra parcelada',
            'amount' => $amount,
            'status' => 'unpaid',
            'total_installments' => $installments,
            'is_recurring' => false,
            'created_at' => '2027-01-05 10:00:00',
        ]);
    }

    public function test_100_in_3_installments_sums_exactly_with_remainder_on_first(): void
    {
        $transacao = $this->purchase('100.00', 3);

        $schedule = app(FaturaService::class)->buildInstallmentSchedule($transacao);

        $this->assertSame(['33.34', '33.33', '33.33'], array_column($schedule, 'amount'));
    }

    public function test_created_parcelas_sum_to_purchase_amount(): void
    {
        $transacao = $this->purchase('1000.00', 7);

        $transacao->parcelas()->delete();
        app(FaturaService::class)->createParcelas($transacao);

        $amounts = $transacao->parcelas()->orderBy('installment_number')->pluck('amount')->map(fn ($a) => (string) $a)->all();

        $this->assertSame(['142.86', '142.86', '142.86', '142.86', '142.86', '142.85', '142.85'], $amounts);
    }

    public function test_installment_amount_without_loaded_parcelas_uses_split(): void
    {
        $transacao = $this->purchase('100.00', 3)->fresh();

        $this->assertFalse($transacao->relationLoaded('parcelas'));
        $this->assertSame(3334, $transacao->getInstallmentAmountCents(1));
        $this->assertSame(3333, $transacao->getInstallmentAmountCents(3));
        $this->assertSame(3334, $transacao->getInstallmentAmountCents());
    }
}

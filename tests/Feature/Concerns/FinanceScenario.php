<?php

namespace Tests\Feature\Concerns;

use App\Actions\Transacao\CreateTransacao;
use App\Actions\Transacao\PayFaturaMonth;
use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Card;
use App\Models\CardUser;
use App\Models\Category;
use App\Models\Income;
use App\Models\Transacao;
use App\Models\User;
use Carbon\Carbon;

/**
 * Cenário fixo usado pelos testes de caracterização do Dashboard e do Resumo
 * mensal e pelos testes das Queries. "Hoje" é 15/11/2026 10:00.
 *
 * Cartão "Cartão Azul": fechamento dia 5 (compra a partir do dia 5 vai para a
 * fatura do mês seguinte).
 *
 * | Lançamento | Data       | Tipo    | Valor  | Detalhe                         | Fatura(s)                     |
 * |------------|------------|---------|--------|---------------------------------|-------------------------------|
 * | mercadoX3  | 20/09/2026 | crédito | 300,00 | 3x, Mercado, cartão             | 2026-10, 2026-11, 2026-12     |
 * | cinema     | 02/10/2026 | crédito | 120,00 | à vista, Lazer, cartão          | 2026-10                       |
 * | streaming  | 10/10/2026 | crédito |  50,00 | recorrente, Lazer, cartão       | 2026-11 em diante             |
 * | farmacia   | 03/11/2026 | crédito |  90,00 | à vista, sem categoria, cartão  | 2026-11                       |
 * | feiraX2    | 07/11/2026 | crédito |  60,00 | 2x, Mercado, sem cartão         | 2026-11, 2026-12              |
 * | padaria    | 15/10/2026 | débito  | 200,00 | Mercado, cartão                 |                               |
 * | bar        | 08/11/2026 | débito  |  80,00 | Lazer, sem cartão               |                               |
 * | acougue    | 10/11/2026 | débito  |  40,00 | Mercado, sem cartão             |                               |
 *
 * Em 01/11/2026 a fatura 2026-10 do cartão é paga: 100,00 (1ª parcela) + 120,00 = 220,00.
 * O cinema vira "paid"; a 1ª parcela do mercadoX3 também.
 *
 * Receitas: salário recorrente 5000,00 (ativo) e pix avulso 300,00 em 12/11/2026.
 * Contas: Aluguel 1500,00 (mensal, dia 10) e Luz variável (mensal, dia 20) com
 * dois pagamentos (110,00 e 130,00, média 120,00).
 */
trait FinanceScenario
{
    protected User $user;

    protected CardUser $card;

    protected Category $mercado;

    protected Category $lazer;

    /** @var array<string, Transacao> */
    protected array $tx = [];

    protected function seedFinanceScenario(): void
    {
        Carbon::setTestNow('2026-09-01 09:00:00');

        $this->user = User::factory()->create(['name' => 'Cenário', 'email' => 'cenario@example.com']);
        $this->card = CardUser::create([
            'card_id' => Card::create(['name' => 'Cartão Azul'])->id,
            'user_id' => $this->user->id,
            'closing_day' => 5,
            'due_day' => 12,
        ]);
        $this->mercado = Category::create(['name' => 'Mercado', 'user_id' => $this->user->id, 'color' => '#00aa00', 'icon' => 'cart']);
        $this->lazer = Category::create(['name' => 'Lazer', 'user_id' => $this->user->id, 'color' => '#aa00aa', 'icon' => 'film']);

        $this->purchase('mercadoX3', '2026-09-20 12:00:00', '300.00', 'credit', $this->mercado, true, 3);
        $this->purchase('cinema', '2026-10-02 12:00:00', '120.00', 'credit', $this->lazer, true);
        $this->purchase('streaming', '2026-10-10 12:00:00', '50.00', 'credit', $this->lazer, true, 1, true);
        $this->purchase('padaria', '2026-10-15 12:00:00', '200.00', 'debit', $this->mercado, true);

        Carbon::setTestNow('2026-11-01 08:00:00');
        app(PayFaturaMonth::class)->handle($this->user, ['month' => '2026-10', 'bank_user_id' => $this->card->id]);

        $this->purchase('farmacia', '2026-11-03 12:00:00', '90.00', 'credit', null, true);
        $this->purchase('feiraX2', '2026-11-07 12:00:00', '60.00', 'credit', $this->mercado, false, 2);
        $this->purchase('bar', '2026-11-08 12:00:00', '80.00', 'debit', $this->lazer, false);
        $this->purchase('acougue', '2026-11-10 12:00:00', '40.00', 'debit', $this->mercado, false);

        Carbon::setTestNow('2026-11-01 08:00:00');
        Income::forceCreate([
            'user_id' => $this->user->id,
            'title' => 'Salário',
            'amount' => '5000.00',
            'type' => 'salary',
            'payment_day_type' => 'fixed',
            'payment_day_value' => 5,
            'is_active' => true,
            'is_recurring' => true,
        ]);
        Income::forceCreate([
            'user_id' => $this->user->id,
            'title' => 'Pix recebido',
            'amount' => '300.00',
            'type' => 'pix',
            'is_active' => true,
            'is_recurring' => false,
            'received_at' => '2026-11-12',
        ]);

        Bill::create([
            'user_id' => $this->user->id,
            'title' => 'Aluguel',
            'amount' => '1500.00',
            'recurrence_type' => 'monthly',
            'due_day' => 10,
            'start_date' => '2026-01-01',
            'status' => 'active',
        ]);
        $luz = Bill::create([
            'user_id' => $this->user->id,
            'title' => 'Luz',
            'amount' => null,
            'recurrence_type' => 'monthly',
            'due_day' => 20,
            'start_date' => '2026-01-01',
            'status' => 'active',
        ]);
        foreach (['2026-09-20' => '110.00', '2026-10-20' => '130.00'] as $due => $paid) {
            BillPayment::create([
                'bill_id' => $luz->id,
                'due_date' => $due,
                'paid_date' => $due,
                'amount_due' => $paid,
                'amount_paid' => $paid,
                'status' => 'paid',
            ]);
        }

        Carbon::setTestNow('2026-11-15 10:00:00');
    }

    private function purchase(
        string $key,
        string $date,
        string $amount,
        string $type,
        ?Category $category,
        bool $onCard,
        int $installments = 1,
        bool $recurring = false,
    ): void {
        Carbon::setTestNow($date);

        $this->tx[$key] = app(CreateTransacao::class)->handle($this->user, [
            'title' => ucfirst($key),
            'amount' => $amount,
            'type' => $type,
            'total_installments' => $installments,
            'is_recurring' => $recurring,
            'bank_user_id' => $onCard ? $this->card->id : null,
            'category_id' => $category?->id,
        ]);
    }
}

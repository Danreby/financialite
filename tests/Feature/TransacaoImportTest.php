<?php

namespace Tests\Feature;

use App\Models\Card;
use App\Models\CardUser;
use App\Models\Category;
use App\Models\Transacao;
use App\Models\User;
use App\Services\FaturaImportService;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Importação de faturas (POST /transacoes/import, só web): limite de 500 linhas,
 * resolução de cartão e categoria por nome e atomicidade.
 */
class TransacaoImportTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    /** @return list<array<string, mixed>> */
    private function rows(int $count): array
    {
        $rows = [];
        for ($i = 1; $i <= $count; $i++) {
            $rows[] = ['title' => 'Linha '.$i, 'amount' => '10.00', 'type' => 'debit'];
        }

        return $rows;
    }

    public function test_imports_exactly_500_rows(): void
    {
        $this->actingAs($this->user)
            ->postJson('/transacoes/import', ['rows' => $this->rows(500)])
            ->assertOk()
            ->assertJsonPath('imported_count', 500);

        $this->assertSame(500, Transacao::where('user_id', $this->user->id)->count());
    }

    public function test_501_rows_are_rejected_by_the_request_and_nothing_is_saved(): void
    {
        $this->actingAs($this->user)
            ->postJson('/transacoes/import', ['rows' => $this->rows(501)])
            ->assertStatus(422)
            ->assertJsonValidationErrors('rows');

        $this->assertSame(0, Transacao::count());
    }

    public function test_service_also_enforces_the_500_row_limit(): void
    {
        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('O número máximo de registros por importação é 500.');

        app(FaturaImportService::class)->importRows($this->user, $this->rows(501));
    }

    public function test_empty_rows_are_rejected(): void
    {
        $this->actingAs($this->user)
            ->postJson('/transacoes/import', ['rows' => []])
            ->assertStatus(422)
            ->assertJsonValidationErrors('rows');
    }

    public function test_resolves_card_and_category_by_name_ignoring_case(): void
    {
        $card = CardUser::create([
            'card_id' => Card::create(['name' => 'Cartão Azul'])->id,
            'user_id' => $this->user->id,
            'closing_day' => 5,
            'due_day' => 12,
        ]);
        $category = Category::create(['name' => 'Mercado', 'user_id' => $this->user->id]);

        $this->actingAs($this->user)
            ->postJson('/transacoes/import', ['rows' => [[
                'title' => 'Compra no cartão',
                'amount' => '90.50',
                'type' => 'credit',
                'bank_user_name' => 'CARTÃO AZUL',
                'category_name' => 'mercado',
            ]]])
            ->assertOk()
            ->assertJsonPath('imported_count', 1);

        $transacao = Transacao::where('user_id', $this->user->id)->firstOrFail();
        $this->assertSame($card->id, $transacao->bank_user_id);
        $this->assertSame($category->id, $transacao->category_id);
        $this->assertSame('90.50', (string) $transacao->amount);
    }

    public function test_unknown_card_name_aborts_the_whole_import(): void
    {
        $this->actingAs($this->user)
            ->postJson('/transacoes/import', ['rows' => [
                ['title' => 'Primeira', 'amount' => '10.00', 'type' => 'debit'],
                ['title' => 'Segunda', 'amount' => '10.00', 'type' => 'credit', 'bank_user_name' => 'Cartão Fantasma'],
            ]])
            ->assertStatus(422)
            ->assertJsonFragment(['error' => 'Cartão não encontrado para o nome informado na linha 3: Cartão Fantasma']);

        // A primeira linha também some: a importação roda numa transação.
        $this->assertSame(0, Transacao::count());
    }

    public function test_other_users_card_name_is_not_resolved(): void
    {
        $other = User::factory()->create();
        CardUser::create([
            'card_id' => Card::create(['name' => 'Cartão do Outro'])->id,
            'user_id' => $other->id,
            'closing_day' => 5,
            'due_day' => 12,
        ]);

        $this->actingAs($this->user)
            ->postJson('/transacoes/import', ['rows' => [
                ['title' => 'Tentativa', 'amount' => '10.00', 'type' => 'credit', 'bank_user_name' => 'Cartão do Outro'],
            ]])
            ->assertStatus(422);

        $this->assertSame(0, Transacao::count());
    }

    public function test_installment_rows_create_the_parcelas(): void
    {
        $this->actingAs($this->user)
            ->postJson('/transacoes/import', ['rows' => [
                ['title' => 'Notebook', 'amount' => '100.00', 'type' => 'credit', 'total_installments' => 3],
            ]])
            ->assertOk();

        $transacao = Transacao::where('user_id', $this->user->id)->firstOrFail();
        $this->assertSame(
            ['33.34', '33.33', '33.33'],
            $transacao->parcelas()->orderBy('installment_number')->pluck('amount')->map(fn ($a) => (string) $a)->all()
        );
    }
}

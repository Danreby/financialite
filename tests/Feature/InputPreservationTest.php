<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Transacao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class InputPreservationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // A listagem usa DATE_FORMAT do MySQL; no SQLite dos testes registramos um equivalente.
        DB::connection()->getPdo()->sqliteCreateFunction(
            'DATE_FORMAT',
            fn ($date, $format) => $date === null ? null : date(str_replace(['%Y', '%m', '%d'], ['Y', 'm', 'd'], $format), strtotime($date)),
            2
        );
    }

    public function test_transaction_title_keeps_case_and_symbols(): void
    {
        $user = User::factory()->create();
        $title = 'Mercado Pão de Açúcar & Cia -- SELECT';

        $this->actingAs($user)
            ->postJson(route('transacoes.store'), [
                'title' => $title,
                'description' => 'Compra do MÊS -- select * from lista',
                'amount' => 100,
                'type' => 'debit',
            ])
            ->assertSuccessful();

        $this->assertDatabaseHas('transacoes', [
            'user_id' => $user->id,
            'title' => $title,
            'description' => 'Compra do MÊS -- select * from lista',
        ]);
    }

    public function test_category_color_keeps_uppercase_hex(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson(route('categories.store'), [
                'name' => 'Alimentação Fora',
                'color' => '#AABBCC',
                'type' => 'expense',
            ])
            ->assertSuccessful();

        $this->assertDatabaseHas('categories', [
            'user_id' => $user->id,
            'name' => 'Alimentação Fora',
            'color' => '#AABBCC',
        ]);
    }

    public function test_category_name_uniqueness_ignores_case(): void
    {
        $user = User::factory()->create();
        Category::create(['name' => 'Mercado', 'type' => 'expense', 'user_id' => $user->id]);

        $this->actingAs($user)
            ->postJson(route('categories.store'), ['name' => 'MERCADO', 'type' => 'expense'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }

    public function test_search_with_percent_matches_literally(): void
    {
        $user = User::factory()->create();
        Transacao::factory()->create(['user_id' => $user->id, 'title' => 'Desconto 50% loja']);
        Transacao::factory()->create(['user_id' => $user->id, 'title' => 'Desconto 50 reais']);
        Transacao::factory()->create(['user_id' => $user->id, 'title' => 'Pao_de_queijo']);
        Transacao::factory()->create(['user_id' => $user->id, 'title' => 'Pao de queijo']);

        $titles = function (string $search) use ($user): array {
            $titles = [];
            $this->actingAs($user)
                ->get(route('transactions.index', ['search' => $search]))
                ->assertInertia(function ($page) use (&$titles) {
                    $titles = collect($page->toArray()['props']['transactions']['data'])->pluck('title')->all();
                });

            return $titles;
        };

        $this->assertSame(['Desconto 50% loja'], $titles('50%'));
        $this->assertSame(['Pao_de_queijo'], $titles('Pao_de'));
        $this->assertCount(0, $titles('%%'));
    }

    public function test_search_keeps_apostrophes_unescaped(): void
    {
        $user = User::factory()->create();
        Transacao::factory()->create(['user_id' => $user->id, 'title' => "McDonald's"]);

        $this->actingAs($user)
            ->get(route('transactions.index', ['search' => "McDonald's"]))
            ->assertInertia(fn ($page) => $page
                ->where('filters.search', "McDonald's")
                ->has('transactions.data', 1));
    }

    public function test_suspicious_input_is_logged_not_blocked(): void
    {
        $this->assertFalse(config('security.suspicious_activity.block_requests'));
    }
}

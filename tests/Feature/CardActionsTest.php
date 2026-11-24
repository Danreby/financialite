<?php

namespace Tests\Feature;

use App\Models\Card;
use App\Models\CardUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Vínculo de cartão (card_user) e cadastro de cartão próprio. Web (cards.attach,
 * cards.update-due-day) e API (/api/v1/cards, /api/v1/card-users, /api/v1/card-resources)
 * chamam as mesmas Actions.
 */
class CardActionsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Card $catalog;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->catalog = Card::create(['name' => 'Catálogo', 'brand' => 'visa']);
    }

    /**
     * Rotas que vinculam um cartão: [método, url, status quando já vinculado, corpo quando já vinculado].
     *
     * @return array<string, array{0: string, 1: string}>
     */
    public static function attachRoutes(): array
    {
        return [
            'web cards.attach' => ['web', '/cards/attach'],
            'api cards' => ['api', '/api/v1/cards'],
            'api card-users' => ['api', '/api/v1/card-users'],
        ];
    }

    /** @return array<string, array{0: string, 1: string, 2: string}> */
    public static function updateRoutes(): array
    {
        return [
            'web cards.update-due-day' => ['web', 'patch', '/cards/user/%d/due-day'],
            'api cards' => ['api', 'put', '/api/v1/cards/%d'],
            'api card-users' => ['api', 'put', '/api/v1/card-users/%d'],
        ];
    }

    private function as(string $side, ?User $user = null): static
    {
        return $this->actingAs($user ?? $this->user, $side === 'api' ? 'sanctum' : 'web');
    }

    private function link(?User $owner = null, ?Card $card = null): CardUser
    {
        return CardUser::create([
            'card_id' => ($card ?? $this->catalog)->id,
            'user_id' => ($owner ?? $this->user)->id,
            'due_day' => 10,
            'closing_day' => 3,
        ]);
    }

    #[DataProvider('attachRoutes')]
    public function test_attach_saves_due_and_closing_days(string $side, string $url): void
    {
        $this->as($side)->postJson($url, [
            'card_id' => $this->catalog->id,
            'due_day' => 15,
            'closing_day' => 7,
            'credit_limit' => 2500,
        ])->assertCreated()
            ->assertJsonPath('card_id', $this->catalog->id)
            ->assertJsonPath('card.name', 'Catálogo');

        $this->assertDatabaseHas('card_user', [
            'card_id' => $this->catalog->id,
            'user_id' => $this->user->id,
            'due_day' => 15,
            'closing_day' => 7,
        ]);
    }

    #[DataProvider('attachRoutes')]
    public function test_attach_twice_keeps_one_link(string $side, string $url): void
    {
        $existing = $this->link();

        $response = $this->as($side)->postJson($url, ['card_id' => $this->catalog->id, 'due_day' => 1, 'closing_day' => 1]);

        match ($url) {
            '/cards/attach' => $response->assertOk()
                ->assertJsonPath('already_attached', true)
                ->assertJsonPath('message', 'Este cartão já está vinculado ao usuário.')
                ->assertJsonPath('card_user.id', $existing->id),
            '/api/v1/cards' => $response->assertStatus(422)->assertExactJson(['error' => 'Você já possui este cartão.']),
            default => $response->assertStatus(422)->assertExactJson(['error' => 'Este cartão já está associado ao usuário.']),
        };

        $this->assertSame(1, CardUser::count());
        $this->assertSame(10, $existing->refresh()->due_day);
    }

    #[DataProvider('updateRoutes')]
    public function test_update_link_days_and_limit(string $side, string $method, string $url): void
    {
        $link = $this->link();

        $this->as($side)->{$method.'Json'}(sprintf($url, $link->id), ['due_day' => 20, 'closing_day' => 12, 'credit_limit' => 900])
            ->assertOk()
            ->assertJsonPath('id', $link->id)
            ->assertJsonPath('due_day', 20)
            ->assertJsonPath('closing_day', 12);

        $link->refresh();
        $this->assertSame(20, $link->due_day);
        $this->assertSame(12, $link->closing_day);
    }

    #[DataProvider('updateRoutes')]
    public function test_update_of_other_users_link_returns_404(string $side, string $method, string $url): void
    {
        $link = $this->link(User::factory()->create());

        $this->as($side)->{$method.'Json'}(sprintf($url, $link->id), ['due_day' => 20])->assertNotFound();

        $this->assertSame(10, $link->refresh()->due_day);
    }

    public function test_update_link_edits_details_only_of_own_card(): void
    {
        $own = Card::create(['name' => 'Meu']);
        $own->forceFill(['user_id' => $this->user->id])->save();
        $ownLink = $this->link(null, $own);
        $catalogLink = $this->link();

        foreach ([$ownLink, $catalogLink] as $link) {
            $this->as('api')->putJson('/api/v1/card-users/'.$link->id, ['brand' => 'elo', 'description' => 'nova'])->assertOk();
        }

        $this->assertDatabaseHas('cards', ['id' => $own->id, 'brand' => 'elo', 'description' => 'nova']);
        $this->assertDatabaseHas('cards', ['id' => $this->catalog->id, 'brand' => 'visa', 'description' => null]);
    }

    public function test_detach_via_api_cards_and_card_users(): void
    {
        $first = $this->link();
        $second = $this->link(null, Card::create(['name' => 'Outro do catálogo']));

        $this->as('api')->deleteJson('/api/v1/cards/'.$first->id)
            ->assertOk()->assertExactJson(['message' => 'Cartão removido.']);
        $this->as('api')->deleteJson('/api/v1/card-users/'.$second->id)
            ->assertOk()->assertExactJson(['message' => 'Cartão desassociado do usuário.']);

        $this->assertSame(0, CardUser::count());
        $this->assertNotSoftDeleted($this->catalog);

        $foreign = $this->link(User::factory()->create());
        $this->as('api')->deleteJson('/api/v1/cards/'.$foreign->id)->assertNotFound();
        $this->as('api')->deleteJson('/api/v1/card-users/'.$foreign->id)->assertNotFound();
        $this->assertSame(1, CardUser::count());
    }

    public function test_create_own_card_saves_due_and_closing_days(): void
    {
        $id = $this->as('api')->postJson('/api/v1/card-resources', [
            'name' => 'Inter', 'due_day' => 18, 'closing_day' => 9, 'credit_limit' => 1000,
        ])->assertCreated()->assertJsonPath('name', 'Inter')->json('id');

        $this->assertDatabaseHas('cards', ['id' => $id, 'user_id' => $this->user->id]);
        $this->assertDatabaseHas('card_user', ['card_id' => $id, 'user_id' => $this->user->id, 'due_day' => 18, 'closing_day' => 9]);

        $this->as('api')->putJson('/api/v1/card-resources/'.$id, ['name' => 'Inter Black', 'due_day' => 22])
            ->assertOk()->assertJsonPath('name', 'Inter Black');
        $this->assertDatabaseHas('card_user', ['card_id' => $id, 'due_day' => 22, 'closing_day' => 9]);
    }
}

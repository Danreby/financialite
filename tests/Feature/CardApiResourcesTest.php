<?php

namespace Tests\Feature;

use App\Models\Card;
use App\Models\CardUser;
use App\Models\Transacao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Rotas /api/v1/card-resources e /api/v1/card-users (usadas pelo app Android e
 * por resources/js/Services/cardService.js). Formato e status precisam ficar
 * iguais aos de quando eram servidas pelos controllers web.
 */
class CardApiResourcesTest extends TestCase
{
    use RefreshDatabase;

    private function ownCard(User $user, string $name): Card
    {
        $card = Card::create(['name' => $name]);
        $card->forceFill(['user_id' => $user->id])->save();
        CardUser::create(['card_id' => $card->id, 'user_id' => $user->id, 'closing_day' => 3]);

        return $card;
    }

    public function test_card_resources_index_and_show(): void
    {
        $user = User::factory()->create();
        $card = $this->ownCard($user, 'Nubank');
        $other = $this->ownCard(User::factory()->create(), 'Do outro');

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/card-resources')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.id', $card->id);

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/card-resources/'.$card->id)
            ->assertOk()
            ->assertJsonPath('name', 'Nubank');

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/card-resources/'.$other->id)
            ->assertNotFound();
    }

    public function test_card_resources_store_and_update_link_card_user(): void
    {
        $user = User::factory()->create();

        $id = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/card-resources', ['name' => 'Inter', 'closing_day' => 5, 'credit_limit' => 1000])
            ->assertCreated()
            ->assertJsonPath('name', 'Inter')
            ->json('id');

        $this->assertDatabaseHas('card_user', ['card_id' => $id, 'user_id' => $user->id, 'closing_day' => 5]);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/card-resources/'.$id, ['name' => 'Inter Black', 'closing_day' => 8])
            ->assertOk()
            ->assertJsonPath('name', 'Inter Black');

        $this->assertDatabaseHas('card_user', ['card_id' => $id, 'closing_day' => 8]);
    }

    public function test_card_resources_destroy_matches_web_route(): void
    {
        $user = User::factory()->create();
        $viaApi = $this->ownCard($user, 'Via API');
        $viaWeb = $this->ownCard($user, 'Via web');

        $this->actingAs($user, 'sanctum')->deleteJson('/api/v1/card-resources/'.$viaApi->id)
            ->assertOk()
            ->assertExactJson(['message' => 'Cartão removido.']);
        $this->actingAs($user)->deleteJson(route('cards.destroy', $viaWeb->id))
            ->assertOk()
            ->assertExactJson(['message' => 'Cartão removido.']);

        $this->assertSoftDeleted($viaApi);
        $this->assertSoftDeleted($viaWeb);
        $this->assertDatabaseMissing('card_user', ['user_id' => $user->id]);
    }

    public function test_card_users_index_show_store_destroy(): void
    {
        $user = User::factory()->create();
        $catalog = Card::create(['name' => 'Catálogo']);

        $cardUserId = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/card-users', ['card_id' => $catalog->id, 'due_day' => 10, 'closing_day' => 3])
            ->assertCreated()
            ->assertJsonPath('card.name', 'Catálogo')
            ->json('id');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/card-users', ['card_id' => $catalog->id, 'due_day' => 10, 'closing_day' => 3])
            ->assertStatus(422)
            ->assertExactJson(['error' => 'Este cartão já está associado ao usuário.']);

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/card-users')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.card.name', 'Catálogo');

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/card-users/'.$cardUserId)
            ->assertOk()
            ->assertJsonPath('card_id', $catalog->id);

        $this->actingAs(User::factory()->create(), 'sanctum')
            ->getJson('/api/v1/card-users/'.$cardUserId)
            ->assertNotFound();

        $this->actingAs($user, 'sanctum')->deleteJson('/api/v1/card-users/'.$cardUserId)
            ->assertOk()
            ->assertExactJson(['message' => 'Cartão desassociado do usuário.']);
    }

    public function test_card_users_stats(): void
    {
        $user = User::factory()->create();
        $card = $this->ownCard($user, 'Nubank');
        $cardUser = CardUser::where('card_id', $card->id)->first();
        Transacao::factory()->debit()->create(['user_id' => $user->id, 'bank_user_id' => $cardUser->id, 'amount' => 30]);

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/card-users/stats')
            ->assertOk()
            ->assertJsonPath('0.card_user_id', $cardUser->id)
            ->assertJsonPath('0.card_name', 'Nubank')
            ->assertJsonPath('0.total_faturas', 1)
            ->assertJsonPath('0.paid_faturas', 1);
    }
}

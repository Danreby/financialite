<?php

namespace Tests\Feature;

use App\Models\Card;
use App\Models\CardUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CardOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private function link(Card $card, User $user): CardUser
    {
        return CardUser::create([
            'card_id' => $card->id,
            'user_id' => $user->id,
            'due_day' => 10,
            'closing_day' => 3,
        ]);
    }

    public function test_destroy_only_detaches_catalog_card(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $catalog = Card::create(['name' => 'Banco Catalogo']);
        $this->link($catalog, $a);
        $this->link($catalog, $b);

        $this->actingAs($a)
            ->deleteJson(route('cards.destroy', $catalog->id))
            ->assertOk();

        $this->assertDatabaseMissing('card_user', ['card_id' => $catalog->id, 'user_id' => $a->id]);
        $this->assertDatabaseHas('card_user', ['card_id' => $catalog->id, 'user_id' => $b->id]);
        $this->assertDatabaseHas('cards', ['id' => $catalog->id, 'deleted_at' => null]);
    }

    public function test_destroy_deletes_own_custom_card(): void
    {
        $a = User::factory()->create();
        $custom = Card::create(['name' => 'Meu cartao']);
        $custom->forceFill(['user_id' => $a->id])->save();
        $this->link($custom, $a);

        $this->actingAs($a)
            ->deleteJson(route('cards.destroy', $custom->id))
            ->assertOk();

        $this->assertSoftDeleted('cards', ['id' => $custom->id]);
    }

    public function test_destroy_of_unlinked_card_returns_404(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $card = Card::create(['name' => 'Do B']);
        $this->link($card, $b);

        $this->actingAs($a)
            ->deleteJson(route('cards.destroy', $card->id))
            ->assertNotFound();
    }

    public function test_list_hides_other_users_custom_cards(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $catalog = Card::create(['name' => 'Catalogo']);
        $mine = Card::create(['name' => 'Meu']);
        $mine->forceFill(['user_id' => $a->id])->save();
        $theirs = Card::create(['name' => 'Do outro']);
        $theirs->forceFill(['user_id' => $b->id])->save();

        $ids = $this->actingAs($a)
            ->getJson(route('cards.list'))
            ->assertOk()
            ->json('*.id');

        $this->assertContains($catalog->id, $ids);
        $this->assertContains($mine->id, $ids);
        $this->assertNotContains($theirs->id, $ids);
    }

    public function test_api_available_hides_other_users_custom_cards(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $catalog = Card::create(['name' => 'Catalogo']);
        $theirs = Card::create(['name' => 'Do outro']);
        $theirs->forceFill(['user_id' => $b->id])->save();

        $ids = $this->actingAs($a, 'sanctum')
            ->getJson('/api/v1/cards/available')
            ->assertOk()
            ->json('*.id');

        $this->assertContains($catalog->id, $ids);
        $this->assertNotContains($theirs->id, $ids);
    }

    public function test_attach_rejects_other_users_custom_card(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $theirs = Card::create(['name' => 'Do outro']);
        $theirs->forceFill(['user_id' => $b->id])->save();

        $this->actingAs($a)
            ->postJson(route('cards.attach'), [
                'card_id' => $theirs->id,
                'due_day' => 10,
                'closing_day' => 3,
            ])
            ->assertStatus(422);

        $this->assertDatabaseMissing('card_user', ['card_id' => $theirs->id, 'user_id' => $a->id]);
    }

    public function test_api_store_rejects_other_users_custom_card(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $theirs = Card::create(['name' => 'Do outro']);
        $theirs->forceFill(['user_id' => $b->id])->save();

        $this->actingAs($a, 'sanctum')
            ->postJson('/api/v1/cards', ['card_id' => $theirs->id])
            ->assertStatus(422);
    }

    public function test_attach_accepts_catalog_card(): void
    {
        $a = User::factory()->create();
        $catalog = Card::create(['name' => 'Catalogo']);

        $this->actingAs($a)
            ->postJson(route('cards.attach'), [
                'card_id' => $catalog->id,
                'due_day' => 10,
                'closing_day' => 3,
            ])
            ->assertCreated();
    }

    public function test_store_sets_owner_on_custom_card(): void
    {
        $a = User::factory()->create();

        $this->actingAs($a, 'sanctum')
            ->postJson('/api/v1/card-resources', ['name' => 'Cartao Novo', 'closing_day' => 5])
            ->assertCreated();

        $this->assertDatabaseHas('cards', ['name' => 'Cartao Novo', 'user_id' => $a->id]);
    }

    public function test_update_rejects_catalog_card(): void
    {
        $a = User::factory()->create();
        $catalog = Card::create(['name' => 'Catalogo']);
        $this->link($catalog, $a);

        $this->actingAs($a, 'sanctum')
            ->putJson('/api/v1/card-resources/'.$catalog->id, ['name' => 'hackeado'])
            ->assertNotFound();

        $this->assertDatabaseHas('cards', ['id' => $catalog->id, 'name' => 'Catalogo']);
    }

    public function test_update_rejects_other_users_card(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $theirs = Card::create(['name' => 'Do outro']);
        $theirs->forceFill(['user_id' => $b->id])->save();
        $this->link($theirs, $b);

        $this->actingAs($a, 'sanctum')
            ->putJson('/api/v1/card-resources/'.$theirs->id, ['name' => 'hackeado'])
            ->assertNotFound();

        $this->assertDatabaseHas('cards', ['id' => $theirs->id, 'name' => 'Do outro']);
    }

    public function test_update_due_day_does_not_edit_catalog_card_details(): void
    {
        $a = User::factory()->create();
        $catalog = Card::create(['name' => 'Catalogo', 'brand' => 'visa']);
        $cardUser = $this->link($catalog, $a);

        $this->actingAs($a)
            ->patchJson(route('cards.update-due-day', $cardUser->id), [
                'due_day' => 15,
                'closing_day' => 5,
                'brand' => 'elo',
                'description' => 'alterada',
            ])
            ->assertOk();

        $this->assertDatabaseHas('card_user', ['id' => $cardUser->id, 'due_day' => 15]);
        $this->assertDatabaseHas('cards', ['id' => $catalog->id, 'brand' => 'visa', 'description' => null]);
    }

    public function test_two_users_can_create_custom_cards_with_same_name(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();

        $this->actingAs($a, 'sanctum')
            ->postJson('/api/v1/card-resources', ['name' => 'meu cartao'])
            ->assertCreated();
        $this->actingAs($b, 'sanctum')
            ->postJson('/api/v1/card-resources', ['name' => 'meu cartao'])
            ->assertCreated();

        $this->actingAs($a, 'sanctum')
            ->postJson('/api/v1/card-resources', ['name' => 'meu cartao'])
            ->assertStatus(422);
    }
}

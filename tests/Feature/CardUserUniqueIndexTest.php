<?php

namespace Tests\Feature;

use App\Models\Card;
use App\Models\CardUser;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * card_user mantém o índice único (card_id, user_id) depois das migrations que
 * renomearam bank_user/bank_id para card_user/card_id. É ele que garante um só
 * vínculo por cartão, mesmo com duas requisições simultâneas ao AttachCard.
 */
class CardUserUniqueIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_card_user_has_unique_index_on_card_and_user(): void
    {
        $unique = collect(Schema::getIndexes('card_user'))
            ->filter(fn (array $index) => $index['unique'] && ! $index['primary'])
            ->map(fn (array $index) => collect($index['columns'])->sort()->values()->all());

        $this->assertContains(['card_id', 'user_id'], $unique->all());
    }

    public function test_duplicate_link_is_rejected_by_the_database(): void
    {
        $user = User::factory()->create();
        $card = Card::create(['name' => 'Catálogo']);
        CardUser::create(['card_id' => $card->id, 'user_id' => $user->id]);

        $this->expectException(UniqueConstraintViolationException::class);
        CardUser::create(['card_id' => $card->id, 'user_id' => $user->id]);
    }
}

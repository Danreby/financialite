<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\BankUser;
use App\Models\Card;
use App\Models\CardUser;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionFormOptionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get(route('transaction-form.options'))->assertRedirect(route('login'));
    }

    public function test_returns_only_the_user_lists_for_the_new_transaction_form(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        Category::create(['user_id' => $user->id, 'name' => 'Mercado', 'type' => 'expense']);
        Category::create(['user_id' => $other->id, 'name' => 'De outro usuário', 'type' => 'expense']);

        $myCard = CardUser::create(['card_id' => Card::create(['name' => 'Meu cartão'])->id, 'user_id' => $user->id]);
        $otherCard = CardUser::create(['card_id' => Card::create(['name' => 'Cartão de outro'])->id, 'user_id' => $other->id]);
        $myBank = BankUser::create(['bank_id' => Bank::create(['name' => 'Meu banco'])->id, 'user_id' => $user->id]);
        $otherBank = BankUser::create(['bank_id' => Bank::create(['name' => 'Banco de outro'])->id, 'user_id' => $other->id]);

        $response = $this->actingAs($user)
            ->getJson(route('transaction-form.options'))
            ->assertOk()
            ->assertJsonStructure(['bankAccounts', 'categories', 'bankAccountsList']);

        $names = collect($response->json('categories'))->pluck('name');

        $this->assertContains('Mercado', $names);
        $this->assertNotContains('De outro usuário', $names);

        $cardIds = collect($response->json('bankAccounts'))->pluck('id');
        $this->assertContains($myCard->id, $cardIds);
        $this->assertNotContains($otherCard->id, $cardIds);

        $bankIds = collect($response->json('bankAccountsList'))->pluck('id');
        $this->assertContains($myBank->id, $bankIds);
        $this->assertNotContains($otherBank->id, $bankIds);
    }
}

<?php

namespace Tests\Feature;

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

        $response = $this->actingAs($user)
            ->getJson(route('transaction-form.options'))
            ->assertOk()
            ->assertJsonStructure(['bankAccounts', 'categories', 'bankAccountsList']);

        $names = collect($response->json('categories'))->pluck('name');

        $this->assertContains('Mercado', $names);
        $this->assertNotContains('De outro usuário', $names);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CategoryPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_categories_page_lists_all_user_categories_without_pagination(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        for ($i = 1; $i <= 25; $i++) {
            Category::create(['user_id' => $user->id, 'name' => "Categoria {$i}", 'type' => 'expense']);
        }
        Category::create(['user_id' => $other->id, 'name' => 'De outro usuário', 'type' => 'expense']);

        $this->actingAs($user)
            ->get(route('categorias.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Categorias')
                ->has('categories', 25));
    }
}

<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ThemePreferenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_user_has_no_saved_color_mode_and_brasa_palette(): void
    {
        $user = User::factory()->create();

        $this->assertNull($user->fresh()->color_mode);
        $this->assertSame('brasa', $user->fresh()->theme);
    }

    public function test_dark_is_the_default_mode_on_first_paint(): void
    {
        // fresh(): o padrão da coluna (brasa) vem do banco, como numa requisição real.
        $user = User::factory()->create()->fresh();

        $html = $this->actingAs($user)->get('/dashboard')->assertOk()->getContent();

        $this->assertMatchesRegularExpression('/<html[^>]*class="dark"/', $html);
        $this->assertStringContainsString('var key = "brasa";', $html);
        $this->assertStringContainsString('<meta name="theme-color" content="#0B0B0C">', $html);
    }

    public function test_light_mode_is_not_rendered_dark(): void
    {
        $user = User::factory()->create(['color_mode' => 'light']);

        $html = $this->actingAs($user)->get('/dashboard')->assertOk()->getContent();

        $this->assertDoesNotMatchRegularExpression('/<html[^>]*class="dark"/', $html);
        $this->assertStringContainsString('<meta name="theme-color" content="#F4F4F5">', $html);
    }

    public function test_existing_saved_palette_is_kept(): void
    {
        $user = User::factory()->create(['theme' => 'rose']);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertInertia(fn ($page) => $page->where('auth.user.theme', 'rose'));
    }

    public function test_brasa_palette_can_be_saved(): void
    {
        $user = User::factory()->create(['theme' => 'rose']);

        $this->actingAs($user)
            ->patchJson('/settings/theme', ['theme' => 'brasa'])
            ->assertOk()
            ->assertJson(['theme' => 'brasa']);

        $this->assertSame('brasa', $user->fresh()->theme);
    }

    public function test_color_mode_can_be_saved(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patchJson('/settings/theme', ['color_mode' => 'dark'])
            ->assertOk()
            ->assertJson(['theme' => 'brasa', 'color_mode' => 'dark']);

        $this->assertSame('dark', $user->fresh()->color_mode);
    }

    public function test_color_mode_can_follow_the_system(): void
    {
        $user = User::factory()->create(['color_mode' => 'dark']);

        $this->actingAs($user)
            ->patchJson('/settings/theme', ['color_mode' => 'system'])
            ->assertOk()
            ->assertJson(['color_mode' => 'system']);

        $this->assertSame('system', $user->fresh()->color_mode);
    }

    public function test_color_mode_can_be_reset_to_default(): void
    {
        $user = User::factory()->create(['color_mode' => 'light']);

        $this->actingAs($user)
            ->patchJson('/settings/theme', ['color_mode' => null])
            ->assertOk()
            ->assertJson(['color_mode' => null]);

        $this->assertNull($user->fresh()->color_mode);
    }

    public function test_palette_and_color_mode_can_be_saved_together(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patchJson('/settings/theme', ['theme' => 'forest', 'color_mode' => 'light'])
            ->assertOk();

        $user->refresh();
        $this->assertSame('forest', $user->theme);
        $this->assertSame('light', $user->color_mode);
    }

    public function test_saving_palette_alone_keeps_color_mode(): void
    {
        $user = User::factory()->create(['color_mode' => 'dark']);

        $this->actingAs($user)
            ->patchJson('/settings/theme', ['theme' => 'gold'])
            ->assertOk();

        $user->refresh();
        $this->assertSame('gold', $user->theme);
        $this->assertSame('dark', $user->color_mode);
    }

    public function test_invalid_color_mode_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patchJson('/settings/theme', ['color_mode' => 'sepia'])
            ->assertStatus(422);

        $this->assertNull($user->fresh()->color_mode);
    }

    public function test_empty_request_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patchJson('/settings/theme', [])
            ->assertStatus(422);
    }

    public function test_color_mode_is_shared_with_the_frontend(): void
    {
        $user = User::factory()->create(['theme' => 'midnight', 'color_mode' => 'dark']);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertInertia(fn ($page) => $page
                ->where('auth.user.theme', 'midnight')
                ->where('auth.user.color_mode', 'dark'));
    }

    public function test_guest_cannot_change_theme(): void
    {
        $this->patchJson('/settings/theme', ['color_mode' => 'dark'])
            ->assertUnauthorized();
    }

    public function test_first_paint_uses_saved_mode_and_palette(): void
    {
        $user = User::factory()->create(['theme' => 'forest', 'color_mode' => 'dark']);

        $html = $this->actingAs($user)->get('/dashboard')->assertOk()->getContent();

        $this->assertMatchesRegularExpression('/<html[^>]*class="dark"/', $html);
        $this->assertStringContainsString('var key = "forest";', $html);
        $this->assertStringContainsString('"accentText":"#2DD4BF"', $html);
    }
}

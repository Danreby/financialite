<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UiKitPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_ui_kit_is_not_found_outside_local_for_guests(): void
    {
        $this->get('/_ui')->assertNotFound();
    }

    public function test_ui_kit_is_not_found_outside_local_for_users(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/_ui')
            ->assertNotFound();
    }

    public function test_ui_kit_is_not_found_in_production(): void
    {
        $this->app['env'] = 'production';

        $this->actingAs(User::factory()->create())
            ->get('/_ui')
            ->assertNotFound();
    }

    public function test_ui_kit_renders_in_local_for_users(): void
    {
        $this->app['env'] = 'local';

        $this->actingAs(User::factory()->create())
            ->get('/_ui')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Dev/UiKit'));
    }

    public function test_ui_kit_asks_guests_to_log_in_in_local(): void
    {
        $this->app['env'] = 'local';

        $this->get('/_ui')->assertRedirect(route('login'));
    }
}

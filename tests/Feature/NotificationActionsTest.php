<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Notificações pela web (/notifications) e pela API (/api/v1/notifications).
 * A posse (usuário B recebe 404) está em OwnershipMatrixTest.
 */
class NotificationActionsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    private function notify(string $title, ?User $owner = null, bool $read = false): Notification
    {
        return Notification::create([
            'user_id' => ($owner ?? $this->user)->id,
            'title' => $title,
            'message' => 'Mensagem de '.$title,
            'type' => 'info',
            'is_read' => $read,
            'read_at' => $read ? now() : null,
        ]);
    }

    public function test_web_mark_as_read_sets_flag_and_timestamp(): void
    {
        $notification = $this->notify('Aviso');

        $this->actingAs($this->user)->postJson('/notifications/'.$notification->id.'/read')->assertOk();

        $notification->refresh();
        $this->assertTrue($notification->is_read);
        $this->assertNotNull($notification->read_at);
    }

    public function test_web_mark_all_as_read_only_touches_own_notifications(): void
    {
        $mine = [$this->notify('A'), $this->notify('B')];
        $theirs = $this->notify('Do outro', User::factory()->create());

        $this->actingAs($this->user)->postJson('/notifications/read-all')->assertOk();

        foreach ($mine as $notification) {
            $this->assertTrue($notification->refresh()->is_read);
        }
        $this->assertFalse($theirs->refresh()->is_read);
    }

    public function test_web_unread_count_ignores_read_internal_meta_and_foreign_rows(): void
    {
        $this->notify('Nova 1');
        $this->notify('Nova 2');
        $this->notify('Lida', read: true);
        $this->notify('__meta:budget_alert');
        $this->notify('Do outro', User::factory()->create());

        $this->actingAs($this->user)->getJson('/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('unread_count', 2);
    }

    public function test_web_clear_all_keeps_meta_rows_and_foreign_notifications(): void
    {
        $this->notify('Comum');
        $meta = $this->notify('__meta:budget_alert');
        $theirs = $this->notify('Do outro', User::factory()->create());

        $this->actingAs($this->user)->deleteJson('/notifications')->assertOk();

        $this->assertDatabaseMissing('notifications', ['title' => 'Comum']);
        $this->assertDatabaseHas('notifications', ['id' => $meta->id]);
        $this->assertDatabaseHas('notifications', ['id' => $theirs->id]);
    }

    public function test_web_index_lists_only_own_notifications_without_meta_rows(): void
    {
        $this->notify('Minha');
        $this->notify('__meta:budget_alert');
        $this->notify('Do outro', User::factory()->create());

        $titles = collect($this->actingAs($this->user)->getJson('/notifications')->assertOk()->json())->pluck('title');

        $this->assertSame(['Minha'], $titles->all());
    }

    public function test_api_list_count_read_and_clear(): void
    {
        $first = $this->notify('Primeira');
        $this->notify('Segunda');
        $meta = $this->notify('__meta:budget_alert');
        $theirs = $this->notify('Do outro', User::factory()->create());

        $this->actingAs($this->user, 'sanctum');

        $this->getJson('/api/v1/notifications')->assertOk()->assertJsonPath('total', 2); // a linha __meta: não aparece
        $this->getJson('/api/v1/notifications/unread-count')->assertOk()->assertJsonPath('count', 2);

        $this->patchJson('/api/v1/notifications/'.$first->id.'/read')->assertOk();
        $this->getJson('/api/v1/notifications/unread-count')->assertJsonPath('count', 1);

        $this->postJson('/api/v1/notifications/mark-all-read')->assertOk();
        $this->getJson('/api/v1/notifications/unread-count')->assertJsonPath('count', 0);

        $this->deleteJson('/api/v1/notifications/clear-all')->assertOk();
        $this->assertSame(0, Notification::where('user_id', $this->user->id)->where('title', 'not like', '__meta:%')->count());
        $this->assertDatabaseHas('notifications', ['id' => $meta->id]);
        $this->assertDatabaseHas('notifications', ['id' => $theirs->id, 'is_read' => false]);
    }

    #[DataProvider('nonNumericIds')]
    public function test_non_numeric_ids_are_404(string $method, string $uri, bool $api): void
    {
        $this->actingAs($this->user, $api ? 'sanctum' : 'web')->json($method, $uri)->assertNotFound();
    }

    /** @return array<string, array{0: string, 1: string, 2: bool}> */
    public static function nonNumericIds(): array
    {
        return [
            'web read' => ['POST', '/notifications/abc/read', false],
            'api read' => ['PATCH', '/api/v1/notifications/abc/read', true],
            'api read com sufixo' => ['PATCH', '/api/v1/notifications/1x/read', true],
        ];
    }
}

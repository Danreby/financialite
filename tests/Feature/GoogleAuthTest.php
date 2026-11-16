<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Auth\GoogleTokenVerifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    private function mockGoogle(array $overrides = []): void
    {
        $payload = array_merge([
            'sub' => 'google-123',
            'email' => 'vitima@example.com',
            'email_verified' => true,
            'name' => 'Vitima',
            'picture' => 'https://example.com/a.png',
            'nonce' => 'nonce-ok',
        ], $overrides);

        $this->mock(GoogleTokenVerifier::class, function ($mock) use ($payload) {
            $mock->shouldReceive('verify')->andReturn($payload);
        });
    }

    private function unverifiedAttackerAccount(): User
    {
        $user = User::factory()->unverified()->create([
            'email' => 'vitima@example.com',
            'password' => 'senha-do-atacante',
        ]);
        $user->createToken('mobile-app');
        DB::table('sessions')->insert([
            'id' => 'sessao-do-atacante',
            'user_id' => $user->id,
            'ip_address' => '1.1.1.1',
            'user_agent' => 'x',
            'payload' => 'x',
            'last_activity' => time(),
        ]);

        return $user;
    }

    public function test_google_link_to_unverified_account_resets_password_and_sessions(): void
    {
        $this->mockGoogle();
        $user = $this->unverifiedAttackerAccount();

        $this->withSession(['google_nonce' => 'nonce-ok'])
            ->postJson(route('google.token'), ['credential' => 'x'])
            ->assertOk();

        $user->refresh();
        $this->assertNull($user->password);
        $this->assertSame('google-123', $user->google_id);
        $this->assertTrue($user->hasVerifiedEmail());
        $this->assertSame(0, $user->tokens()->count());
        $this->assertDatabaseMissing('sessions', ['id' => 'sessao-do-atacante']);
    }

    public function test_api_google_link_to_unverified_account_resets_password_and_tokens(): void
    {
        $this->mockGoogle();
        $user = $this->unverifiedAttackerAccount();

        $this->postJson('/api/v1/auth/google', ['id_token' => 'x'])->assertOk();

        $user->refresh();
        $this->assertNull($user->password);
        $this->assertDatabaseMissing('sessions', ['id' => 'sessao-do-atacante']);
        // Só o token novo do app sobrevive.
        $this->assertSame(1, $user->tokens()->count());
    }

    public function test_verified_account_keeps_password_and_sessions_when_linking(): void
    {
        $this->mockGoogle();
        $user = User::factory()->create(['email' => 'vitima@example.com']);
        $hash = $user->password;

        $this->withSession(['google_nonce' => 'nonce-ok'])
            ->postJson(route('google.token'), ['credential' => 'x'])
            ->assertOk();

        $user->refresh();
        $this->assertSame($hash, $user->password);
        $this->assertSame('google-123', $user->google_id);
    }

    public function test_web_login_requires_matching_nonce_and_is_single_use(): void
    {
        $this->mockGoogle();

        $this->postJson(route('google.token'), ['credential' => 'x'])->assertStatus(422);

        $this->withSession(['google_nonce' => 'outro'])
            ->postJson(route('google.token'), ['credential' => 'x'])->assertStatus(422);

        $this->withSession(['google_nonce' => 'nonce-ok'])
            ->postJson(route('google.token'), ['credential' => 'x'])->assertOk();

        $this->assertNull(session('google_nonce'));
    }

    public function test_nonce_endpoint_issues_and_stores_nonce(): void
    {
        $nonce = $this->getJson(route('google.nonce'))->assertOk()->json('nonce');

        $this->assertNotEmpty($nonce);
        $this->assertSame($nonce, session('google_nonce'));
    }

    public function test_api_nonce_is_optional_but_verified_when_sent(): void
    {
        $this->mockGoogle();

        $this->postJson('/api/v1/auth/google', ['id_token' => 'x'])->assertOk();
        $this->postJson('/api/v1/auth/google', ['id_token' => 'x', 'nonce' => 'nonce-ok'])->assertOk();
        $this->postJson('/api/v1/auth/google', ['id_token' => 'x', 'nonce' => 'errado'])->assertStatus(422);
    }

    public function test_user_with_null_password_logs_in_with_google_and_password_login_does_not_500(): void
    {
        $this->mockGoogle();
        $user = User::factory()->create(['email' => 'vitima@example.com', 'google_id' => 'google-123', 'password' => null]);

        $this->post('/login', ['email' => $user->email, 'password' => 'qualquer-coisa'])
            ->assertSessionHasErrors('email');
        $this->assertGuest();

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'qualquer-coisa'])
            ->assertStatus(422);

        $this->withSession(['google_nonce' => 'nonce-ok'])
            ->postJson(route('google.token'), ['credential' => 'x'])->assertOk();
        $this->assertAuthenticatedAs($user);
    }
}

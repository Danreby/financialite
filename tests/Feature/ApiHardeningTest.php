<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_can_resend_verification_email(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/auth/email/verification-notification')
            ->assertOk()
            ->assertJsonPath('message', 'Enviamos um novo link de confirmação para o seu e-mail.');

        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_api_resend_when_already_verified(): void
    {
        Notification::fake();
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/auth/email/verification-notification')
            ->assertOk()
            ->assertJsonPath('message', 'Seu e-mail já está confirmado.');

        Notification::assertNothingSent();
    }

    public function test_unverified_user_gets_403_on_protected_api_routes(): void
    {
        $user = User::factory()->unverified()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/transacoes')
            ->assertForbidden()
            ->assertJsonPath('message', 'Confirme seu e-mail para continuar.');
    }

    public function test_unverified_user_can_still_reach_auth_endpoints(): void
    {
        $user = User::factory()->unverified()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/user')->assertOk();
        $this->postJson('/api/v1/auth/logout')->assertOk();
    }

    public function test_verified_user_reaches_protected_api_routes(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/transacoes')->assertOk();
    }

    public function test_sanctum_tokens_expire_in_30_days(): void
    {
        $this->assertSame(60 * 24 * 30, config('sanctum.expiration'));
    }

    public function test_api_login_is_throttled_per_email_across_ips(): void
    {
        $user = User::factory()->create(['email' => 'alvo@example.com']);

        foreach (range(1, 5) as $i) {
            $this->withServerVariables(['REMOTE_ADDR' => "10.0.0.$i"])
                ->postJson('/api/v1/auth/login', ['email' => 'alvo@example.com', 'password' => 'errada'])
                ->assertStatus(422);
        }

        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.99'])
            ->postJson('/api/v1/auth/login', ['email' => 'ALVO@example.com', 'password' => 'errada'])
            ->assertStatus(429);
    }

    public function test_web_login_is_throttled_per_email_across_ips(): void
    {
        User::factory()->create(['email' => 'alvo@example.com']);

        foreach (range(1, 5) as $i) {
            $this->withServerVariables(['REMOTE_ADDR' => "10.0.1.$i"])
                ->post('/login', ['email' => 'alvo@example.com', 'password' => 'errada']);
        }

        $this->withServerVariables(['REMOTE_ADDR' => '10.0.1.99'])
            ->post('/login', ['email' => 'alvo@example.com', 'password' => 'errada'])
            ->assertSessionHasErrors('email');

        $this->assertGuest();
        $this->assertStringContainsString(
            'Muitas tentativas',
            session('errors')->first('email')
        );
    }

    public function test_financial_api_responses_are_not_cached(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->getJson('/bank-accounts/stats');

        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertStringContainsString('private', $response->headers->get('Cache-Control'));
    }

    public function test_deleting_account_revokes_sanctum_tokens(): void
    {
        $user = User::factory()->create();
        $user->createToken('mobile-app');

        $this->actingAs($user)->delete('/profile', ['password' => 'password'])->assertRedirect('/');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_google_only_user_confirms_web_deletion_with_email(): void
    {
        $user = User::factory()->create(['password' => null, 'google_id' => 'g-123']);

        $this->actingAs($user)->from('/profile')
            ->delete('/profile', ['email' => 'outro@example.com'])
            ->assertSessionHasErrors('email');
        $this->assertNotNull($user->fresh());

        $this->actingAs($user)
            ->delete('/profile', ['email' => strtoupper($user->email)])
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');
        $this->assertNull($user->fresh());
    }

    public function test_google_only_user_confirms_api_deletion_with_email(): void
    {
        $user = User::factory()->create(['password' => null, 'google_id' => 'g-123']);
        Sanctum::actingAs($user);

        $this->deleteJson('/api/v1/profile', ['email' => 'x@example.com'])->assertStatus(422);
        $this->deleteJson('/api/v1/profile', ['email' => $user->email])->assertOk();
        $this->assertNull($user->fresh());
    }
}

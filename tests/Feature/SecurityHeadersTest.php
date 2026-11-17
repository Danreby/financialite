<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    private function asProduction(): void
    {
        $this->app['env'] = 'production';
    }

    public function test_csp_is_enforcing_with_nonce_in_production(): void
    {
        $this->asProduction();

        $response = $this->get('/login');

        $csp = $response->headers->get('Content-Security-Policy');
        $this->assertNotNull($csp);
        $this->assertNull($response->headers->get('Content-Security-Policy-Report-Only'));
        $this->assertStringContainsString("'nonce-", $csp);
        $this->assertStringNotContainsString('unsafe-eval', $csp);
        $this->assertStringContainsString("object-src 'none'", $csp);
        $this->assertStringContainsString('https://accounts.google.com/gsi/client', $csp);
        $this->assertDoesNotMatchRegularExpression("/script-src[^;]*'unsafe-inline'/", $csp);
        $this->assertStringNotContainsString('localhost:5173', $csp);
    }

    public function test_script_tags_carry_the_same_nonce_as_the_header(): void
    {
        $this->asProduction();

        $response = $this->get('/login');

        $this->assertSame(1, preg_match("/'nonce-([^']+)'/", $response->headers->get('Content-Security-Policy'), $m));
        $html = $response->getContent();

        preg_match_all('/<script\b[^>]*>/i', $html, $tags);
        $this->assertNotEmpty($tags[0]);
        foreach ($tags[0] as $tag) {
            $this->assertStringContainsString('nonce="'.$m[1].'"', $tag, "Script sem nonce: {$tag}");
        }
    }

    public function test_nonce_changes_per_request(): void
    {
        $this->asProduction();

        $a = $this->get('/login')->headers->get('Content-Security-Policy');
        $b = $this->get('/login')->headers->get('Content-Security-Policy');

        $this->assertNotSame($a, $b);
    }

    public function test_csp_is_not_applied_outside_production_by_default(): void
    {
        $response = $this->get('/login');

        $this->assertNull($response->headers->get('Content-Security-Policy'));
        $this->assertNull($response->headers->get('Content-Security-Policy-Report-Only'));
    }

    public function test_x_xss_protection_header_is_removed(): void
    {
        $response = $this->get('/login');

        $this->assertFalse($response->headers->has('X-XSS-Protection'));
        $this->assertSame('nosniff', $response->headers->get('X-Content-Type-Options'));
    }

    public function test_check_command_fails_with_insecure_config(): void
    {
        config(['app.debug' => true, 'session.secure' => false, 'session.encrypt' => false]);

        $this->artisan('app:check-production-config')->assertExitCode(1);
    }

    public function test_check_command_passes_with_secure_config(): void
    {
        $this->asProduction();
        config(['app.debug' => false, 'session.secure' => true, 'session.encrypt' => true]);

        $this->artisan('app:check-production-config')->assertExitCode(0);
    }
}

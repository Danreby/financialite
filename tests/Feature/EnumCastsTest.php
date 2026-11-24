<?php

namespace Tests\Feature;

use App\Enums\BillStatus;
use App\Enums\TransacaoParcelaStatus;
use App\Enums\TransacaoStatus;
use App\Enums\TransacaoType;
use App\Models\Bill;
use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Feature\Concerns\FinanceScenario;
use Tests\TestCase;

/**
 * Os enums de app/Enums viram cast nos models, mas o JSON (API e props do
 * Inertia) continua com as mesmas strings de antes.
 */
class EnumCastsTest extends TestCase
{
    use FinanceScenario;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedFinanceScenario();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_models_read_enums(): void
    {
        $cinema = $this->tx['cinema']->fresh(['parcelas']);

        $this->assertSame(TransacaoType::Credit, $cinema->type);
        $this->assertSame(TransacaoStatus::Paid, $cinema->status);
        $this->assertSame(TransacaoParcelaStatus::Paid, $cinema->parcelas->first()->status);
        $this->assertSame(TransacaoStatus::Unpaid, $this->tx['farmacia']->fresh()->status);
        $this->assertSame(TransacaoType::Debit, $this->tx['bar']->fresh()->type);
        $this->assertSame(BillStatus::Active, Bill::where('title', 'Aluguel')->first()->status);
    }

    public function test_api_response_keeps_string_values(): void
    {
        $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/transacoes/'.$this->tx['mercadoX3']->id)
            ->assertOk()
            ->assertJsonPath('type', 'credit')
            ->assertJsonPath('status', 'unpaid')
            ->assertJsonPath('parcelas.0.status', 'paid')
            ->assertJsonPath('parcelas.1.status', 'pending');

        $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/bills')
            ->assertOk()
            ->assertJsonPath('0.status', 'active');
    }

    public function test_inertia_props_keep_string_values(): void
    {
        $response = $this->actingAs($this->user)->get('/transactions')->assertOk();

        $rows = collect($response->viewData('page')['props']['transactions']['data']);
        $bar = $rows->firstWhere('title', 'Bar');

        $this->assertSame('debit', $bar['type']);
        $this->assertSame('paid', $bar['status']);

        $page = $this->actingAs($this->user)->get('/transacoes')->assertOk()->viewData('page');
        $november = collect($page['props']['monthlyGroups'])->firstWhere('month_key', '2026-11');
        $item = collect($november['items'])->firstWhere('title', 'Farmacia');

        $this->assertSame('credit', $item['type']);
        $this->assertSame('pending', $item['status']);
    }

    /** @return array<string, array{0: string, 1: array<string, string>, 2: string}> */
    public static function invalidValues(): array
    {
        return [
            'tipo' => ['/api/v1/transacoes', ['type' => 'transfer', 'status' => 'paid'], 'type'],
            'status' => ['/api/v1/transacoes', ['type' => 'credit', 'status' => 'pending'], 'status'],
        ];
    }

    #[DataProvider('invalidValues')]
    public function test_validation_uses_the_enums(string $url, array $override, string $field): void
    {
        $this->actingAs($this->user, 'sanctum')
            ->postJson($url, ['title' => 'Teste', 'amount' => '10.00'] + $override)
            ->assertStatus(422)
            ->assertJsonValidationErrors($field);
    }

    public function test_import_accepts_enum_values_and_defaults_to_unpaid(): void
    {
        $this->actingAs($this->user)
            ->postJson('/transacoes/import', ['rows' => [
                ['title' => 'Importada', 'amount' => '25.00', 'type' => 'credit'],
                ['title' => 'Importada paga', 'amount' => '10.00', 'type' => 'debit', 'status' => 'paid'],
            ]])
            ->assertOk()
            ->assertJsonPath('imported_count', 2);

        $this->assertDatabaseHas('transacoes', ['title' => 'Importada', 'type' => 'credit', 'status' => 'unpaid']);
        $this->assertDatabaseHas('transacoes', ['title' => 'Importada paga', 'type' => 'debit', 'status' => 'paid']);
    }

    public function test_bill_status_validation_uses_the_enum(): void
    {
        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/bills', [
                'title' => 'Internet',
                'amount' => '99.90',
                'recurrence_type' => 'monthly',
                'due_day' => 15,
                'start_date' => '2026-11-01',
                'status' => 'paused',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }

    /** @return array<string, array{0: string, 1: string, 2: string}> */
    public static function notificationSides(): array
    {
        return [
            'web' => ['web', 'post', '/notifications/%d/read'],
            'api' => ['sanctum', 'patch', '/api/v1/notifications/%d/read'],
        ];
    }

    #[DataProvider('notificationSides')]
    public function test_other_users_notification_returns_404(string $guard, string $method, string $path): void
    {
        $other = User::factory()->create();
        $foreign = Notification::create(['user_id' => $other->id, 'title' => 'Outra', 'message' => 'x', 'type' => 'info']);
        $own = Notification::create(['user_id' => $this->user->id, 'title' => 'Minha', 'message' => 'x', 'type' => 'info']);

        $this->actingAs($this->user, $guard)
            ->json($method, sprintf($path, $foreign->id))
            ->assertNotFound();
        $this->assertFalse($foreign->fresh()->is_read);

        $this->actingAs($this->user, $guard)
            ->json($method, sprintf($path, $own->id))
            ->assertOk();
        $this->assertTrue($own->fresh()->is_read);
    }
}

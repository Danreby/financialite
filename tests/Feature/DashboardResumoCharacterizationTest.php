<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Feature\Concerns\FinanceScenario;
use Tests\TestCase;

/**
 * Testes de caracterização: guardam a resposta inteira (JSON e props do Inertia)
 * das telas e endpoints que consomem os dados do Dashboard e do Resumo mensal,
 * para o cenário fixo de FinanceScenario.
 *
 * Os arquivos em tests/Fixtures/characterization foram gerados com o código
 * anterior à divisão em Queries (task 34). Para regerar de propósito:
 * UPDATE_SNAPSHOTS=1 php artisan test --filter=DashboardResumoCharacterizationTest
 *
 * Só roda no SQLite: no MySQL, SUM() devolve string decimal ("300.00") onde o
 * SQLite devolve número, e os ids não voltam a 1 entre testes. Os números do
 * cenário são conferidos nos dois bancos pelos testes de cada Query.
 */
class DashboardResumoCharacterizationTest extends TestCase
{
    use FinanceScenario;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::connection()->getDriverName() !== 'sqlite') {
            $this->markTestSkipped('Snapshot gerado no SQLite.');
        }

        $this->seedFinanceScenario();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    /** @return array<string, array{0: string, 1: string, 2: string}> */
    public static function endpoints(): array
    {
        return [
            'dashboard web' => ['dashboard_web', 'web', '/dashboard/data'],
            'dashboard web por cartão' => ['dashboard_web_card', 'web', '/dashboard/data?bank_user_id={card}'],
            'dashboard web por categoria' => ['dashboard_web_category', 'web', '/dashboard/data?category_id={mercado}'],
            'dashboard api' => ['dashboard_api', 'api', '/api/v1/dashboard'],
            'stats web' => ['stats_web', 'web', '/transacoes/stats'],
            'stats api por cartão' => ['stats_api_card', 'api', '/api/v1/transacoes/stats?bank_user_id={card}'],
            'stats api cartão vazio' => ['stats_api_card_empty', 'api', '/api/v1/transacoes/stats?bank_user_id='],
            'top spending web' => ['top_spending_web', 'web', '/transacoes/top-spending-by-period?month_from=2026-10&month_to=2026-12'],
            'top spending api um mês' => ['top_spending_api', 'api', '/api/v1/transacoes/top-spending?month_from=2026-11&month_to=2026-11'],
            'relatórios web' => ['reports_web', 'web', '/reports/data'],
            'transações json web' => ['transacoes_web_json', 'web', '/transacoes'],
            'transações api' => ['transacoes_api', 'api', '/api/v1/transacoes'],
            'faturas api' => ['faturas_api', 'api', '/api/v1/transacoes/faturas'],
            'faturas api mês' => ['faturas_api_month', 'api', '/api/v1/transacoes/faturas?month=2026-11'],
            'transação api' => ['transacao_api_show', 'api', '/api/v1/transacoes/{mercadoX3}'],
            'resumo mensal novembro' => ['resumo_2026_11', 'web', '/resumo-mensal/data?month_key=2026-11'],
            'resumo mensal outubro' => ['resumo_2026_10', 'web', '/resumo-mensal/data?month_key=2026-10'],
            'resumo mensal padrão' => ['resumo_default', 'web', '/resumo-mensal/data'],
        ];
    }

    #[DataProvider('endpoints')]
    public function test_json_response_is_unchanged(string $snapshot, string $side, string $url): void
    {
        $response = $this->actingAs($this->user, $side === 'api' ? 'sanctum' : 'web')
            ->getJson($this->resolveUrl($url));

        $response->assertOk();

        $this->assertMatchesSnapshot($snapshot, $response->json());
    }

    /** @return array<string, array{0: string, 1: string}> */
    public static function inertiaPages(): array
    {
        return [
            'página Fatura' => ['page_fatura', '/transacoes'],
            'página Transações' => ['page_transactions', '/transactions'],
            'página Resumo mensal' => ['page_resumo', '/resumo-mensal'],
        ];
    }

    #[DataProvider('inertiaPages')]
    public function test_inertia_props_are_unchanged(string $snapshot, string $url): void
    {
        $response = $this->actingAs($this->user)->get($url);

        $response->assertOk();

        $props = json_decode(json_encode($response->viewData('page')['props']), true);
        unset($props['auth'], $props['errors'], $props['flash'], $props['ziggy'], $props['csrf_token']);

        $this->assertMatchesSnapshot($snapshot, $props);
    }

    private function resolveUrl(string $url): string
    {
        return strtr($url, [
            '{card}' => (string) $this->card->id,
            '{mercado}' => (string) $this->mercado->id,
            '{mercadoX3}' => (string) $this->tx['mercadoX3']->id,
        ]);
    }

    private function assertMatchesSnapshot(string $name, mixed $data): void
    {
        $path = base_path("tests/Fixtures/characterization/{$name}.json");
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION)."\n";

        if (getenv('UPDATE_SNAPSHOTS') || ! File::exists($path)) {
            File::ensureDirectoryExists(dirname($path));
            File::put($path, $json);
            $this->markTestIncomplete("Snapshot {$name} gravado.");
        }

        $this->assertSame(File::get($path), $json, "Resposta mudou em relação ao snapshot {$name}.");
    }
}

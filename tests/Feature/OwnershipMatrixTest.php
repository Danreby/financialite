<?php

namespace Tests\Feature;

use App\Models\Anexo;
use App\Models\Bank;
use App\Models\BankUser;
use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Budget;
use App\Models\Card;
use App\Models\CardUser;
use App\Models\Category;
use App\Models\Income;
use App\Models\Notification;
use App\Models\SavingsGoal;
use App\Models\Transacao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Matriz de posse: para toda rota com id (API v1 e web autenticada), o usuário B
 * não alcança nem altera nada do usuário A. O teste de cobertura garante que uma
 * rota nova com id entre na matriz.
 *
 * Toda rota da matriz responde 404: o recurso é buscado dentro do escopo do
 * usuário (findOrFail com forUser ou route model binding com escopo), então o
 * recurso de outro usuário é tratado como inexistente.
 */
class OwnershipMatrixTest extends TestCase
{
    use RefreshDatabase;

    private User $a;

    private User $b;

    /** @var array<string, int> ids dos recursos do usuário A, por apelido */
    private array $ids = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->a = User::factory()->create();
        $this->b = User::factory()->create();
        $this->seedOwnerResources();
    }

    private function seedOwnerResources(): void
    {
        $category = Category::create(['name' => 'Mercado', 'user_id' => $this->a->id]);
        $transacao = Transacao::factory()->create(['user_id' => $this->a->id, 'type' => 'debit', 'status' => 'paid', 'total_installments' => 1]);
        $bill = Bill::create([
            'title' => 'Internet', 'amount' => 100, 'recurrence_type' => 'monthly', 'due_day' => 10,
            'start_date' => '2026-01-01', 'status' => 'active', 'user_id' => $this->a->id,
        ]);
        $payment = BillPayment::create([
            'bill_id' => $bill->id, 'due_date' => '2026-02-10', 'paid_date' => '2026-02-10',
            'amount_due' => 100, 'amount_paid' => 100, 'status' => 'paid',
        ]);
        $budget = Budget::create(['monthly_limit' => '2000.00', 'month_year' => '2026-11', 'is_active' => true, 'user_id' => $this->a->id]);
        $income = new Income([
            'title' => 'Salário', 'amount' => '3000.00', 'type' => 'salary', 'is_recurring' => true,
            'is_active' => true, 'auto_deposit' => true, 'payment_day_type' => 'fixed', 'payment_day_value' => 5,
        ]);
        $income->user_id = $this->a->id;
        $income->save();
        $goal = new SavingsGoal(['title' => 'Viagem', 'target_amount' => '1000.00', 'current_amount' => '100.00']);
        $goal->user_id = $this->a->id;
        $goal->save();
        $notification = Notification::create(['user_id' => $this->a->id, 'title' => 'Aviso', 'message' => 'Olá', 'type' => 'info']);
        $bankUser = BankUser::create(['bank_id' => Bank::create(['name' => 'Banco A'])->id, 'user_id' => $this->a->id, 'balance' => 0]);
        $card = Card::create(['name' => 'Cartão A']);
        $card->forceFill(['user_id' => $this->a->id])->save();
        $cardUser = CardUser::create(['card_id' => $card->id, 'user_id' => $this->a->id, 'due_day' => 10, 'closing_day' => 3]);
        $anexo = Anexo::factory()->create(['user_id' => $this->a->id]);
        DB::table('anexo_transacao')->insert(['anexo_id' => $anexo->id, 'transacao_id' => $transacao->id, 'created_at' => now(), 'updated_at' => now()]);

        $this->ids = [
            'category' => $category->id, 'transacao' => $transacao->id, 'bill' => $bill->id,
            'payment' => $payment->id, 'budget' => $budget->id, 'income' => $income->id,
            'goal' => $goal->id, 'notification' => $notification->id, 'bankUser' => $bankUser->id,
            'card' => $card->id, 'cardUser' => $cardUser->id, 'anexo' => $anexo->id,
        ];
    }

    /**
     * [método, uri com :apelidos, status esperado, corpo].
     *
     * @return list<array{0: string, 1: string, 2: int, 3?: array<string, mixed>}>
     */
    public static function apiMatrix(): array
    {
        return [
            ['GET', '/api/v1/bank-accounts/:bankUser', 404],
            ['PUT', '/api/v1/bank-accounts/:bankUser', 404, ['balance' => '1.00']],
            ['DELETE', '/api/v1/bank-accounts/:bankUser', 404],
            ['GET', '/api/v1/bank-accounts/:bankUser/ledger', 404],
            ['PUT', '/api/v1/bills/:bill', 404, ['title' => 'x', 'amount' => 1, 'recurrence_type' => 'monthly', 'due_day' => 5, 'start_date' => '2026-01-01']],
            ['DELETE', '/api/v1/bills/:bill', 404],
            ['POST', '/api/v1/bills/:bill/pay', 404, ['due_date' => '2026-03-10', 'paid_date' => '2026-03-10', 'amount_paid' => 10]],
            ['PATCH', '/api/v1/bills/:bill/toggle', 404],
            ['PUT', '/api/v1/budgets/:budget', 404, ['monthly_limit' => '1.00']],
            ['DELETE', '/api/v1/budgets/:budget', 404],
            ['GET', '/api/v1/card-resources/:card', 404],
            ['PUT', '/api/v1/card-resources/:card', 404, ['name' => 'Cartão hackeado']],
            ['DELETE', '/api/v1/card-resources/:card', 404],
            ['GET', '/api/v1/card-users/:cardUser', 404],
            ['PUT', '/api/v1/card-users/:cardUser', 404, ['due_day' => 20]],
            ['DELETE', '/api/v1/card-users/:cardUser', 404],
            ['PUT', '/api/v1/cards/:cardUser', 404, ['due_day' => 20]],
            ['DELETE', '/api/v1/cards/:card', 404],
            ['PUT', '/api/v1/categories/:category', 404, ['name' => 'Categoria hackeada']],
            ['DELETE', '/api/v1/categories/:category', 404],
            ['PUT', '/api/v1/incomes/:income', 404, ['title' => 'Salário hackeado', 'amount' => '1.00', 'type' => 'salary']],
            ['DELETE', '/api/v1/incomes/:income', 404],
            ['PATCH', '/api/v1/incomes/:income/toggle', 404],
            ['PATCH', '/api/v1/incomes/:income/toggle-auto-deposit', 404],
            ['PATCH', '/api/v1/notifications/:notification/read', 404],
            ['PUT', '/api/v1/savings/:goal', 404, ['title' => 'Título hackeado']],
            ['DELETE', '/api/v1/savings/:goal', 404],
            ['POST', '/api/v1/savings/:goal/deposit', 404, ['amount' => '10']],
            ['POST', '/api/v1/savings/:goal/withdraw', 404, ['amount' => '10']],
            ['GET', '/api/v1/transacoes/:transacao', 404],
            ['PUT', '/api/v1/transacoes/:transacao', 404, ['title' => 'Título hackeado']],
            ['DELETE', '/api/v1/transacoes/:transacao', 404],
            ['POST', '/api/v1/transacoes/:transacao/restore', 404],
        ];
    }

    /**
     * @return list<array{0: string, 1: string, 2: int, 3?: array<string, mixed>}>
     */
    public static function webMatrix(): array
    {
        return [
            ['DELETE', '/anexos/:anexo/transacao/:transacao', 404],
            ['GET', '/anexos/:anexo', 404],
            ['PUT', '/anexos/:anexo', 404, ['description' => 'x']],
            ['DELETE', '/anexos/:anexo', 404],
            ['GET', '/anexos/:anexo/download', 404],
            ['GET', '/anexos/:anexo/preview', 404],
            ['GET', '/transacoes/:transacao/anexos', 404],
            ['GET', '/bank-accounts/:bankUser', 404],
            ['PUT', '/bank-accounts/:bankUser', 404, ['balance' => '1.00']],
            ['DELETE', '/bank-accounts/:bankUser', 404],
            ['GET', '/bank-accounts/:bankUser/ledger', 404],
            ['PUT', '/bills/:bill', 404, ['title' => 'x', 'amount' => 1, 'recurrence_type' => 'monthly', 'due_day' => 5, 'start_date' => '2026-01-01']],
            ['DELETE', '/bills/:bill', 404],
            ['POST', '/bills/:bill/pay', 404, ['due_date' => '2026-03-10', 'paid_date' => '2026-03-10', 'amount_paid' => 10]],
            ['PATCH', '/bills/:bill/payment/:payment', 404, ['amount_paid' => 1]],
            ['DELETE', '/bills/:bill/payment/:payment', 404],
            ['PATCH', '/bills/:bill/toggle', 404],
            ['PUT', '/budgets/:budget', 404, ['monthly_limit' => '1.00']],
            ['DELETE', '/budgets/:budget', 404],
            ['PATCH', '/cards/user/:cardUser/due-day', 404, ['due_day' => 20]],
            ['DELETE', '/cards/:card', 404],
            ['PUT', '/categories/:category', 404, ['name' => 'Categoria hackeada']],
            ['DELETE', '/categories/:category', 404],
            ['PUT', '/incomes/:income', 404, ['title' => 'Salário hackeado', 'amount' => '1.00', 'type' => 'salary']],
            ['DELETE', '/incomes/:income', 404],
            ['POST', '/incomes/:income/toggle', 404],
            ['POST', '/incomes/:income/toggle-auto-deposit', 404],
            ['POST', '/notifications/:notification/read', 404],
            ['PUT', '/savings/:goal', 404, ['title' => 'Título hackeado']],
            ['DELETE', '/savings/:goal', 404],
            ['POST', '/savings/:goal/deposit', 404, ['amount' => '10']],
            ['POST', '/savings/:goal/withdraw', 404, ['amount' => '10']],
            ['GET', '/transacoes/:transacao', 404],
            ['PUT', '/transacoes/:transacao', 404, ['title' => 'Título hackeado']],
            ['DELETE', '/transacoes/:transacao', 404],
            ['POST', '/transacoes/:transacao/restore', 404],
        ];
    }

    /** @return array<string, array{0: string, 1: string, 2: int, 3?: array<string, mixed>}> */
    public static function apiProvider(): array
    {
        $cases = [];
        foreach (self::apiMatrix() as $row) {
            $cases[$row[0].' '.$row[1]] = $row;
        }

        return $cases;
    }

    /** @return array<string, array{0: string, 1: string, 2: int, 3?: array<string, mixed>}> */
    public static function webProvider(): array
    {
        $cases = [];
        foreach (self::webMatrix() as $row) {
            $cases[$row[0].' '.$row[1]] = $row;
        }

        return $cases;
    }

    private function resolve(string $uri): string
    {
        // Mais longos primeiro: ":cardUser" não pode ser lido como ":card".
        $keys = array_keys($this->ids);
        usort($keys, fn ($x, $y) => strlen($y) <=> strlen($x));
        foreach ($keys as $key) {
            $uri = str_replace(':'.$key, (string) $this->ids[$key], $uri);
        }

        return $uri;
    }

    /** Estado completo das tabelas de negócio, para provar que nada mudou. */
    private function snapshot(): string
    {
        $ignored = ['migrations', 'sessions', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs', 'personal_access_tokens', 'password_reset_tokens'];
        $state = [];
        foreach (Schema::getTableListing(schemaQualified: false) as $table) {
            if (in_array($table, $ignored, true)) {
                continue;
            }
            $rows = DB::table($table)->get()->map(fn ($row) => json_encode($row))->all();
            sort($rows);
            $state[$table] = $rows;
        }

        return (string) json_encode($state);
    }

    private function assertForeignUserIsRejected(string $method, string $uri, int $status, array $body, string $guard): void
    {
        $before = $this->snapshot();

        $response = $this->actingAs($this->b, $guard)->json($method, $this->resolve($uri), $body);

        $this->assertSame($status, $response->getStatusCode(), "$method $uri devolveu {$response->getStatusCode()}, esperado $status");
        $this->assertSame($before, $this->snapshot(), "$method $uri alterou dados do usuário A");
    }

    #[DataProvider('apiProvider')]
    public function test_api_user_b_cannot_reach_user_a_resources(string $method, string $uri, int $status, array $body = []): void
    {
        $this->assertForeignUserIsRejected($method, $uri, $status, $body, 'sanctum');
    }

    #[DataProvider('webProvider')]
    public function test_web_user_b_cannot_reach_user_a_resources(string $method, string $uri, int $status, array $body = []): void
    {
        $this->assertForeignUserIsRejected($method, $uri, $status, $body, 'web');
    }

    /** O dono continua enxergando os próprios recursos nas rotas de leitura (a matriz não é só 404 cego). */
    public function test_owner_still_reaches_own_resources(): void
    {
        $this->actingAs($this->a, 'sanctum');
        $this->getJson($this->resolve('/api/v1/transacoes/:transacao'))->assertOk();
        $this->getJson($this->resolve('/api/v1/card-users/:cardUser'))->assertOk();
        $this->getJson($this->resolve('/api/v1/bank-accounts/:bankUser'))->assertOk();
        $this->getJson($this->resolve('/api/v1/card-resources/:card'))->assertOk();
        $this->actingAs($this->a);
        $this->getJson($this->resolve('/anexos/:anexo'))->assertOk();
    }

    /** Toda rota com id da API v1 e da web autenticada precisa estar na matriz. */
    public function test_matrix_covers_every_route_with_an_id_parameter(): void
    {
        $listed = [];
        foreach (array_merge(self::apiMatrix(), self::webMatrix()) as $row) {
            $listed[] = $row[0].' '.preg_replace('#:[A-Za-z]+#', '{}', ltrim($row[1], '/'));
        }

        $actual = [];
        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();
            $middleware = $route->gatherMiddleware();
            $isApi = str_starts_with($uri, 'api/v1/');
            $isAuthedWeb = ! $isApi && in_array('auth', $middleware, true);
            if (! str_contains($uri, '{') || (! $isApi && ! $isAuthedWeb)) {
                continue;
            }
            $method = collect($route->methods())->first(fn ($m) => ! in_array($m, ['HEAD'], true));
            $actual[] = $method.' '.preg_replace('#\{[^}]+\}#', '{}', $uri);
        }

        // PUT|PATCH conta como PUT na matriz.
        $listed = array_values(array_unique($listed));
        $actual = array_values(array_unique($actual));
        sort($listed);
        sort($actual);

        $this->assertSame([], array_values(array_diff($actual, $listed)), 'Rotas com id fora da matriz de posse.');
        $this->assertSame([], array_values(array_diff($listed, $actual)), 'Linhas da matriz sem rota correspondente.');
    }

    public function test_non_numeric_id_on_a_web_route_is_404_not_500(): void
    {
        $this->actingAs($this->a)
            ->postJson('/notifications/abc/read')
            ->assertNotFound();
    }

    public function test_non_numeric_id_on_an_api_route_is_404_not_500(): void
    {
        $this->actingAs($this->a, 'sanctum')
            ->patchJson('/api/v1/notifications/abc/read')
            ->assertNotFound();
        $this->actingAs($this->a, 'sanctum')
            ->getJson('/api/v1/transacoes/abc')
            ->assertNotFound();
    }

    public function test_numeric_id_constraint_does_not_break_named_sibling_routes(): void
    {
        $this->actingAs($this->a, 'sanctum')->getJson('/api/v1/transacoes/stats')->assertOk();
        $this->actingAs($this->a)->postJson('/notifications/read-all')->assertSuccessful();
    }
}

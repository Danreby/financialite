<?php

namespace Tests\Feature;

use App\Models\Budget;
use App\Models\BudgetCategory;
use App\Models\Category;
use App\Models\Income;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Web (/budgets) e API (/api/v1/budgets) chamam as mesmas Actions de orçamento.
 */
class BudgetActionsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->category = Category::create(['name' => 'Mercado', 'user_id' => $this->user->id]);
    }

    /** @return array<string, array{0: string}> */
    public static function sides(): array
    {
        return ['web' => ['web'], 'api' => ['api']];
    }

    private function as(string $side, ?User $user = null): static
    {
        return $this->actingAs($user ?? $this->user, $side === 'api' ? 'sanctum' : 'web');
    }

    private function url(string $side, string $path = ''): string
    {
        return ($side === 'api' ? '/api/v1/budgets' : '/budgets').$path;
    }

    /** Chave das relações de limites por categoria em cada lado. */
    private function limitsKey(string $side): string
    {
        return $side === 'api' ? 'budget_categories' : 'category_limits';
    }

    private function budget(?User $owner = null, string $month = '2026-10'): Budget
    {
        $budget = Budget::create([
            'monthly_limit' => '2000.00',
            'month_year' => $month,
            'is_active' => true,
            'user_id' => ($owner ?? $this->user)->id,
        ]);
        if (! $owner) {
            BudgetCategory::create(['budget_id' => $budget->id, 'category_id' => $this->category->id, 'limit' => '500.00']);
        }

        return $budget;
    }

    #[DataProvider('sides')]
    public function test_create_budget_with_category_limits(string $side): void
    {
        $this->as($side)->postJson($this->url($side), [
            'monthly_limit' => '3000.00',
            'month_year' => '2026-11',
            'category_limits' => [['category_id' => $this->category->id, 'limit' => '800.50']],
        ])->assertCreated()
            ->assertJsonPath('month_year', '2026-11')
            ->assertJsonPath($this->limitsKey($side).'.0.category.id', $this->category->id);

        $budget = Budget::firstOrFail();
        $this->assertSame($this->user->id, $budget->user_id);
        $this->assertTrue((bool) $budget->is_active);
        $this->assertSame(['800.50'], $budget->categoryLimits()->pluck('limit')->map(fn ($v) => (string) $v)->all());
    }

    #[DataProvider('sides')]
    public function test_duplicate_month_is_not_created(string $side): void
    {
        $this->budget(null, '2026-11');

        $this->as($side)->postJson($this->url($side), [
            'monthly_limit' => '3000.00',
            'month_year' => '2026-11',
        ])->assertStatus(500);

        $this->assertSame(1, Budget::count());
    }

    #[DataProvider('sides')]
    public function test_update_budget_replaces_category_limits(string $side): void
    {
        $budget = $this->budget();
        $other = Category::create(['name' => 'Lazer', 'user_id' => $this->user->id]);

        $this->as($side)->putJson($this->url($side, '/'.$budget->id), [
            'monthly_limit' => '2500.00',
            'category_limits' => [['category_id' => $other->id, 'limit' => '300.00']],
        ])->assertOk()
            ->assertJsonPath('monthly_limit', '2500.00')
            ->assertJsonCount(1, $this->limitsKey($side))
            ->assertJsonPath($this->limitsKey($side).'.0.category_id', $other->id);
    }

    #[DataProvider('sides')]
    public function test_delete_budget(string $side): void
    {
        $budget = $this->budget();
        $message = $side === 'web' ? 'Orçamento removido com sucesso.' : 'Orçamento removido.';

        $this->as($side)->deleteJson($this->url($side, '/'.$budget->id))
            ->assertOk()
            ->assertExactJson(['message' => $message]);

        $this->assertSame(0, Budget::count());
        $this->assertSame(0, BudgetCategory::count());
    }

    #[DataProvider('sides')]
    public function test_other_users_budget_returns_404(string $side): void
    {
        $budget = $this->budget(User::factory()->create());

        $this->as($side)->putJson($this->url($side, '/'.$budget->id), ['monthly_limit' => '1.00'])->assertNotFound();
        $this->as($side)->deleteJson($this->url($side, '/'.$budget->id))->assertNotFound();

        $this->assertSame('2000.00', (string) $budget->refresh()->monthly_limit);
    }

    #[DataProvider('sides')]
    public function test_list_budgets(string $side): void
    {
        $this->budget();
        $this->budget(User::factory()->create());

        $this->as($side)->getJson($this->url($side))
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.'.$this->limitsKey($side).'.0.category.id', $this->category->id);
    }

    #[DataProvider('sides')]
    public function test_current_budget(string $side): void
    {
        $this->budget(null, now()->format('Y-m'));

        $response = $this->as($side)->getJson($this->url($side, '/current'))->assertOk();

        if ($side === 'web') {
            $response->assertJsonStructure(['id', 'total_spent', 'remaining', 'percentage', 'monthly_income', 'recommended_limit', 'category_limits' => [['spent', 'remaining', 'percentage']]]);
        } else {
            $response->assertJsonStructure(['budget' => ['id'], 'total_spent', 'remaining', 'percentage', 'categories' => [['spent', 'remaining', 'percentage']]]);
        }
    }

    #[DataProvider('sides')]
    public function test_get_or_create_current_budget_uses_income_rule(string $side): void
    {
        $income = new Income([
            'title' => 'Salário', 'amount' => '1000.00', 'type' => 'salary', 'is_recurring' => true,
            'is_active' => true, 'payment_day_type' => 'fixed', 'payment_day_value' => 5,
        ]);
        $income->user_id = $this->user->id;
        $income->save();

        $method = $side === 'api' ? 'postJson' : 'getJson';
        $this->as($side)->{$method}($this->url($side, '/get-or-create-current'))
            ->assertOk()
            ->assertJsonPath('month_year', now()->format('Y-m'));

        $this->assertSame('800.00', (string) Budget::firstOrFail()->monthly_limit);

        $this->as($side)->{$method}($this->url($side, '/get-or-create-current'))->assertOk();
        $this->assertSame(1, Budget::count());
    }
}

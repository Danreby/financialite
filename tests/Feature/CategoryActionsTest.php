<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Web (/categories) e API (/api/v1/categories) chamam as mesmas Actions de categoria.
 */
class CategoryActionsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
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
        return ($side === 'api' ? '/api/v1/categories' : '/categories').$path;
    }

    private function category(?User $owner = null): Category
    {
        return Category::create([
            'name' => 'Mercado',
            'color' => '#112233',
            'icon' => 'Cart',
            'type' => 'expense',
            'user_id' => ($owner ?? $this->user)->id,
        ]);
    }

    #[DataProvider('sides')]
    public function test_create_category(string $side): void
    {
        $this->as($side)->postJson($this->url($side), ['name' => 'Lazer', 'color' => '#abcdef'])
            ->assertCreated()
            ->assertJsonPath('name', 'Lazer')
            ->assertJsonPath('color', '#abcdef');

        $category = Category::firstOrFail();
        $this->assertSame($this->user->id, $category->user_id);
        $this->assertSame('expense', $category->type);
    }

    /**
     * Contrato herdado de cada lado: o formulário web omite cor/ícone limpos (ausente
     * = remover); a API só altera o que foi enviado. Tipo ausente fica como está.
     */
    #[DataProvider('sides')]
    public function test_update_category(string $side): void
    {
        $category = $this->category();

        $this->as($side)->putJson($this->url($side, '/'.$category->id), ['name' => 'Supermercado', 'color' => '#000000'])
            ->assertOk()
            ->assertJsonPath('name', 'Supermercado')
            ->assertJsonPath('color', '#000000');

        $category->refresh();
        $this->assertSame($side === 'web' ? null : 'Cart', $category->icon);
        $this->assertSame('expense', $category->type);
    }

    #[DataProvider('sides')]
    public function test_delete_category(string $side): void
    {
        $category = $this->category();

        $this->as($side)->deleteJson($this->url($side, '/'.$category->id))
            ->assertOk()
            ->assertExactJson(['message' => 'Categoria removida.']);

        $this->assertSoftDeleted($category);
    }

    #[DataProvider('sides')]
    public function test_other_users_category_returns_404(string $side): void
    {
        $category = $this->category(User::factory()->create());

        $this->as($side)->putJson($this->url($side, '/'.$category->id), ['name' => 'Hackeada'])->assertNotFound();
        $this->as($side)->deleteJson($this->url($side, '/'.$category->id))->assertNotFound();

        $this->assertSame('Mercado', $category->refresh()->name);
        $this->assertNotSoftDeleted($category);
    }
}

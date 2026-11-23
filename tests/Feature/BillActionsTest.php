<?php

namespace Tests\Feature;

use App\Models\Bill;
use App\Models\BillPayment;
use App\Models\Category;
use App\Models\Transacao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Web (/bills) e API (/api/v1/bills) chamam as mesmas Actions de conta a pagar.
 */
class BillActionsTest extends TestCase
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
        return ($side === 'api' ? '/api/v1/bills' : '/bills').$path;
    }

    private function bill(?User $owner = null, string $amount = '100.00'): Bill
    {
        return Bill::create([
            'title' => 'Internet',
            'amount' => $amount,
            'recurrence_type' => 'monthly',
            'due_day' => 10,
            'start_date' => '2026-01-01',
            'status' => 'active',
            'user_id' => ($owner ?? $this->user)->id,
        ]);
    }

    #[DataProvider('sides')]
    public function test_create_bill(string $side): void
    {
        $category = Category::create(['name' => 'Casa', 'user_id' => $this->user->id]);

        $response = $this->as($side)->postJson($this->url($side), [
            'title' => 'Aluguel',
            'amount' => '1500.00',
            'recurrence_type' => 'monthly',
            'due_day' => 5,
            'start_date' => '2026-01-01',
            'category_id' => $category->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('title', 'Aluguel')
            ->assertJsonPath('amount', '1500.00')
            ->assertJsonPath('user_id', $this->user->id)
            ->assertJsonPath('category.id', $category->id);

        $bill = Bill::firstOrFail();
        $this->assertSame('#3b82f6', $bill->color);
        $this->assertSame('FileText', $bill->icon);
        $this->assertSame('active', $bill->status);
    }

    #[DataProvider('sides')]
    public function test_update_bill(string $side): void
    {
        $bill = $this->bill();

        $this->as($side)->putJson($this->url($side, '/'.$bill->id), ['title' => 'Fibra', 'amount' => '120.50'])
            ->assertOk()
            ->assertJsonPath('title', 'Fibra')
            ->assertJsonPath('amount', '120.50')
            ->assertJsonStructure(['category']);
    }

    #[DataProvider('sides')]
    public function test_delete_bill(string $side): void
    {
        $bill = $this->bill();
        $message = $side === 'web' ? 'Conta removida com sucesso.' : 'Conta removida.';

        $this->as($side)->deleteJson($this->url($side, '/'.$bill->id))
            ->assertOk()
            ->assertExactJson(['message' => $message]);

        $this->assertSoftDeleted($bill);
    }

    #[DataProvider('sides')]
    public function test_toggle_bill_status(string $side): void
    {
        $bill = $this->bill();

        $this->as($side)->patchJson($this->url($side, '/'.$bill->id.'/toggle'))
            ->assertOk()
            ->assertJsonPath('id', $bill->id)
            ->assertJsonPath('status', 'inactive');

        $this->as($side)->patchJson($this->url($side, '/'.$bill->id.'/toggle'))
            ->assertOk()
            ->assertJsonPath('status', 'active');
    }

    #[DataProvider('sides')]
    public function test_mark_bill_as_paid(string $side): void
    {
        $bill = $this->bill();

        $this->as($side)->postJson($this->url($side, '/'.$bill->id.'/pay'), [
            'due_date' => '2026-11-10',
            'amount_paid' => '99.90',
        ])->assertOk()
            ->assertJsonPath('bill_id', $bill->id)
            ->assertJsonPath('status', 'paid')
            ->assertJsonPath('amount_paid', '99.90');

        $this->assertSame(1, BillPayment::count());
        $this->assertSame('99.90', Transacao::firstOrFail()->amount);
    }

    #[DataProvider('sides')]
    public function test_other_users_bill_returns_404(string $side): void
    {
        $bill = $this->bill(User::factory()->create());

        $this->as($side)->putJson($this->url($side, '/'.$bill->id), ['title' => 'hackeado'])->assertNotFound();
        $this->as($side)->deleteJson($this->url($side, '/'.$bill->id))->assertNotFound();
        $this->as($side)->patchJson($this->url($side, '/'.$bill->id.'/toggle'))->assertNotFound();
        $this->as($side)->postJson($this->url($side, '/'.$bill->id.'/pay'), ['due_date' => '2026-11-10'])->assertNotFound();

        $bill->refresh();
        $this->assertSame('Internet', $bill->title);
        $this->assertSame('active', $bill->status);
        $this->assertNotSoftDeleted($bill);
        $this->assertSame(0, BillPayment::count());
    }

    #[DataProvider('sides')]
    public function test_list_bills(string $side): void
    {
        $this->bill();
        $this->bill(User::factory()->create());

        $response = $this->as($side)->getJson($this->url($side))->assertOk()->assertJsonCount(1);

        if ($side === 'web') {
            $response->assertJsonStructure([['id', 'payment_stats', 'payment_history', 'is_paid_this_period', 'next_due_date']]);
        } else {
            $response->assertJsonStructure([['id', 'category', 'last_payment']]);
        }
    }

    #[DataProvider('sides')]
    public function test_upcoming_bills(string $side): void
    {
        $this->bill();

        $response = $this->as($side)->getJson($this->url($side, '/upcoming'))->assertOk()->assertJsonCount(1);

        if ($side === 'web') {
            $response->assertJsonStructure([['id', 'due_date', 'days_until', 'status', 'payment_id']]);
        } else {
            $response->assertJsonStructure([['id', 'due_date', 'is_overdue', 'is_paid', 'days_until_due']]);
        }
    }

    public function test_contas_page_props(): void
    {
        $this->bill();

        $this->as('web')->get(route('contas.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Contas')
                ->has('bills', 1)
                ->has('bills.0.payment_stats')
                ->has('categories'));
    }
}

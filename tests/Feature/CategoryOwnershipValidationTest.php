<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryOwnershipValidationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
    }

    private function categoryFor(User $owner): Category
    {
        return Category::create([
            'name' => 'Moradia '.$owner->id,
            'type' => 'expense',
            'user_id' => $owner->id,
        ]);
    }

    private function billPayload(int $categoryId): array
    {
        return [
            'title' => 'Aluguel',
            'amount' => 1500,
            'recurrence_type' => 'monthly',
            'due_day' => 10,
            'start_date' => now()->toDateString(),
            'category_id' => $categoryId,
        ];
    }

    public function test_bill_accepts_own_category(): void
    {
        $category = $this->categoryFor($this->user);

        $this->actingAs($this->user)
            ->postJson(route('bills.store'), $this->billPayload($category->id))
            ->assertCreated()
            ->assertJsonPath('category_id', $category->id);
    }

    public function test_bill_rejects_another_users_category(): void
    {
        $foreignCategory = $this->categoryFor($this->otherUser);

        $this->actingAs($this->user)
            ->postJson(route('bills.store'), $this->billPayload($foreignCategory->id))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('category_id');

        $this->assertDatabaseMissing('bills', ['category_id' => $foreignCategory->id]);
    }

    public function test_budget_rejects_another_users_category(): void
    {
        $foreignCategory = $this->categoryFor($this->otherUser);

        $this->actingAs($this->user)
            ->postJson(route('budgets.store'), [
                'monthly_limit' => 3000,
                'month_year' => now()->format('Y-m'),
                'category_limits' => [
                    ['category_id' => $foreignCategory->id, 'limit' => 500],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('category_limits.0.category_id');

        $this->assertDatabaseMissing('budget_categories', ['category_id' => $foreignCategory->id]);
    }
}

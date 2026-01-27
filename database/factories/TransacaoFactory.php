<?php

namespace Database\Factories;

use App\Models\BankUser;
use App\Models\Category;
use App\Models\Transacao;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Transacao>
 */
class TransacaoFactory extends Factory
{
    protected $model = Transacao::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = $this->faker->randomElement(['credit', 'debit']);
        $isDebit = $type === 'debit';

        return [
            'user_id' => User::factory(),
            'title' => $this->faker->sentence(3),
            'description' => $this->faker->optional(0.7)->sentence(),
            'amount' => $this->faker->randomFloat(2, 10, 5000),
            'type' => $type,
            'status' => $isDebit ? 'paid' : $this->faker->randomElement(['paid', 'unpaid']),
            'paid_date' => $isDebit ? now() : ($this->faker->boolean(30) ? $this->faker->dateTimeThisMonth() : null),
            'total_installments' => $isDebit ? 1 : $this->faker->randomElement([1, 1, 1, 2, 3, 6, 12]),
            'current_installment' => 0,
            'is_recurring' => !$isDebit && $this->faker->boolean(20),
            'bank_user_id' => null,
            'category_id' => null,
        ];
    }

    /**
     * Indicate that the transacao is credit.
     */
    public function credit(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'credit',
            'status' => $this->faker->randomElement(['paid', 'unpaid']),
        ]);
    }

    /**
     * Indicate that the transacao is debit.
     */
    public function debit(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'debit',
            'status' => 'paid',
            'paid_date' => now(),
            'total_installments' => 1,
            'is_recurring' => false,
        ]);
    }

    /**
     * Indicate that the transacao is paid.
     */
    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paid',
            'paid_date' => now(),
        ]);
    }

    /**
     * Indicate that the transacao is unpaid.
     */
    public function unpaid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'unpaid',
            'paid_date' => null,
        ]);
    }

    /**
     * Indicate that the transacao is recurring.
     */
    public function recurring(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_recurring' => true,
            'total_installments' => 1,
        ]);
    }

    /**
     * Indicate that the transacao has installments.
     */
    public function withInstallments(int $total = 12): static
    {
        return $this->state(fn (array $attributes) => [
            'total_installments' => $total,
            'is_recurring' => false,
        ]);
    }
}

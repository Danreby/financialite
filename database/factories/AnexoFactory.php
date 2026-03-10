<?php

namespace Database\Factories;

use App\Models\Anexo;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class AnexoFactory extends Factory
{
    protected $model = Anexo::class;

    public function definition(): array
    {
        $extensions = ['jpg', 'png', 'pdf', 'xlsx', 'csv', 'txt'];
        $extension = $this->faker->randomElement($extensions);
        
        $mimeTypes = [
            'jpg' => 'image/jpeg',
            'png' => 'image/png',
            'pdf' => 'application/pdf',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'csv' => 'text/csv',
            'txt' => 'text/plain',
        ];

        return [
            'user_id' => User::factory(),
            'original_name' => $this->faker->word() . '.' . $extension,
            'stored_name' => Str::uuid()->toString() . '.' . $extension,
            'mime_type' => $mimeTypes[$extension],
            'extension' => $extension,
            'size' => $this->faker->numberBetween(1024, 5 * 1024 * 1024),
            'disk' => 'anexos',
            'path' => 'users/' . $this->faker->numberBetween(1, 100) . '/' . date('Y') . '/' . date('m'),
            'hash' => hash('sha256', $this->faker->text(100)),
            'description' => $this->faker->optional(0.5)->sentence(),
        ];
    }

    public function image(): static
    {
        return $this->state(fn (array $attributes) => [
            'extension' => 'jpg',
            'mime_type' => 'image/jpeg',
            'original_name' => $this->faker->word() . '.jpg',
            'stored_name' => Str::uuid()->toString() . '.jpg',
        ]);
    }

    public function pdf(): static
    {
        return $this->state(fn (array $attributes) => [
            'extension' => 'pdf',
            'mime_type' => 'application/pdf',
            'original_name' => $this->faker->word() . '.pdf',
            'stored_name' => Str::uuid()->toString() . '.pdf',
        ]);
    }

    public function spreadsheet(): static
    {
        return $this->state(fn (array $attributes) => [
            'extension' => 'xlsx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'original_name' => $this->faker->word() . '.xlsx',
            'stored_name' => Str::uuid()->toString() . '.xlsx',
        ]);
    }
}

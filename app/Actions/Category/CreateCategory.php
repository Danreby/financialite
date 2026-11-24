<?php

namespace App\Actions\Category;

use App\Models\Category;
use App\Models\User;

/**
 * Cria uma categoria do usuário (tipo padrão: despesa). Usada por
 * CategoryController::store (web) e CategoryApiController::store.
 */
class CreateCategory
{
    /**
     * @param  array<string, mixed>  $data  saída de CategoryStoreRequest::validated()
     */
    public function handle(User $user, array $data): Category
    {
        return Category::create([
            'name' => $data['name'],
            'color' => $data['color'] ?? null,
            'icon' => $data['icon'] ?? null,
            'type' => $data['type'] ?? 'expense',
            'user_id' => $user->id,
        ]);
    }
}

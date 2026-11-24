<?php

namespace App\Actions\Category;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Arr;

/**
 * Edita uma categoria do usuário. Só altera os campos presentes em $data; tipo nulo
 * mantém o atual. Usada por CategoryController::update e CategoryApiController::update.
 */
class UpdateCategory
{
    /**
     * @param  array<string, mixed>  $data  saída de CategoryUpdateRequest::validated()
     *
     * @throws ModelNotFoundException categoria de outro usuário
     */
    public function handle(User $user, int $id, array $data): Category
    {
        $category = Category::forUser($user->id)->findOrFail($id);

        $attributes = Arr::only($data, ['name', 'color', 'icon', 'type']);
        if (array_key_exists('type', $attributes) && $attributes['type'] === null) {
            unset($attributes['type']);
        }

        $category->update($attributes);

        return $category;
    }
}

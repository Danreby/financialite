<?php

namespace App\Actions\Category;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Remove (soft delete) uma categoria do usuário. Usada por CategoryController::destroy
 * e CategoryApiController::destroy.
 */
class DeleteCategory
{
    /**
     * @throws ModelNotFoundException categoria de outro usuário
     */
    public function handle(User $user, int $id): void
    {
        Category::forUser($user->id)->findOrFail($id)->delete();
    }
}

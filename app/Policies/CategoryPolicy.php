<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CategoryPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Category $category): bool
    {
        return $this->isOwner($user, $category);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Category $category): bool
    {
        return $this->isOwner($user, $category);
    }

    public function delete(User $user, Category $category): bool
    {
        return $this->isOwner($user, $category);
    }

    public function restore(User $user, Category $category): bool
    {
        return $this->isOwner($user, $category);
    }

    public function forceDelete(User $user, Category $category): bool
    {
        return $this->isOwner($user, $category);
    }

    protected function isOwner(User $user, Category $category): bool
    {
        return $category->user_id === $user->id;
    }
}

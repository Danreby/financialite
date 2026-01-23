<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Policy for Category authorization.
 */
class CategoryPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any categories.
     *
     * @param User $user
     * @return bool
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the category.
     *
     * @param User $user
     * @param Category $category
     * @return bool
     */
    public function view(User $user, Category $category): bool
    {
        return $this->isOwner($user, $category);
    }

    /**
     * Determine whether the user can create categories.
     *
     * @param User $user
     * @return bool
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the category.
     *
     * @param User $user
     * @param Category $category
     * @return bool
     */
    public function update(User $user, Category $category): bool
    {
        return $this->isOwner($user, $category);
    }

    /**
     * Determine whether the user can delete the category.
     *
     * @param User $user
     * @param Category $category
     * @return bool
     */
    public function delete(User $user, Category $category): bool
    {
        return $this->isOwner($user, $category);
    }

    /**
     * Determine whether the user can restore the category.
     *
     * @param User $user
     * @param Category $category
     * @return bool
     */
    public function restore(User $user, Category $category): bool
    {
        return $this->isOwner($user, $category);
    }

    /**
     * Determine whether the user can permanently delete the category.
     *
     * @param User $user
     * @param Category $category
     * @return bool
     */
    public function forceDelete(User $user, Category $category): bool
    {
        return $this->isOwner($user, $category);
    }

    /**
     * Check if the user is the owner of the category.
     *
     * @param User $user
     * @param Category $category
     * @return bool
     */
    protected function isOwner(User $user, Category $category): bool
    {
        return $category->user_id === $user->id;
    }
}

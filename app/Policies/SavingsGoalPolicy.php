<?php

namespace App\Policies;

use App\Models\SavingsGoal;
use App\Models\User;

class SavingsGoalPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, SavingsGoal $goal): bool
    {
        return $goal->belongsToUser($user->id);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, SavingsGoal $goal): bool
    {
        return $goal->belongsToUser($user->id);
    }

    public function delete(User $user, SavingsGoal $goal): bool
    {
        return $goal->belongsToUser($user->id);
    }

    public function deposit(User $user, SavingsGoal $goal): bool
    {
        return $goal->belongsToUser($user->id);
    }

    public function withdraw(User $user, SavingsGoal $goal): bool
    {
        return $goal->belongsToUser($user->id);
    }
}

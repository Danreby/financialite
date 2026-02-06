<?php

namespace App\Contracts\Services;

use App\Models\SavingsGoal;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;

interface SavingsGoalServiceInterface
{
    public function listForUser(int $userId): Collection;

    public function createForUser(Authenticatable $user, array $data): SavingsGoal;

    public function updateForUser(SavingsGoal $goal, array $data): SavingsGoal;

    public function deleteForUser(SavingsGoal $goal): bool;

    public function deposit(SavingsGoal $goal, float $amount): SavingsGoal;

    public function withdraw(SavingsGoal $goal, float $amount): SavingsGoal;

    public function summaryForUser(int $userId): array;
}

<?php

namespace App\Contracts\Services;

use App\Models\Income;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;

interface IncomeServiceInterface
{
    public function listForUser(int $userId): Collection;

    public function createForUser(Authenticatable $user, array $data): Income;

    public function updateForUser(Income $income, array $data): Income;

    public function deleteForUser(Income $income): bool;

    public function toggleActive(Income $income): Income;

    public function totalMonthlyIncome(int $userId): float;
}

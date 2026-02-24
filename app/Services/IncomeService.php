<?php

namespace App\Services;

use App\Contracts\Services\IncomeServiceInterface;
use App\Models\Income;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class IncomeService implements IncomeServiceInterface
{
    public function listForUser(int $userId): Collection
    {
        return Income::forUser($userId)
            ->with('bankUser.card')
            ->orderByDesc('is_active')
            ->orderBy('title')
            ->get();
    }

    public function createForUser(Authenticatable $user, array $data): Income
    {
        $data['is_active'] = $data['is_active'] ?? true;

        return DB::transaction(function () use ($user, $data) {
            $income = new Income($data);
            $income->user_id = $user->id;
            $income->save();

            return $income;
        });
    }

    public function updateForUser(Income $income, array $data): Income
    {
        return DB::transaction(function () use ($income, $data) {
            $income->update($data);
            return $income->refresh();
        });
    }

    public function deleteForUser(Income $income): bool
    {
        return DB::transaction(function () use ($income) {
            return $income->delete();
        });
    }

    public function toggleActive(Income $income): Income
    {
        return DB::transaction(function () use ($income) {
            $income->is_active = !$income->is_active;
            $income->save();
            return $income->refresh();
        });
    }

    public function totalMonthlyIncome(int $userId): float
    {
        return (float) Income::forUser($userId)
            ->active()
            ->sum('amount');
    }
}

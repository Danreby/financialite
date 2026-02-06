<?php

namespace App\Services;

use App\Contracts\Services\SavingsGoalServiceInterface;
use App\Models\SavingsGoal;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SavingsGoalService implements SavingsGoalServiceInterface
{
    public function listForUser(int $userId): Collection
    {
        return SavingsGoal::forUser($userId)
            ->orderByDesc('is_active')
            ->orderByDesc('created_at')
            ->get();
    }

    public function createForUser(Authenticatable $user, array $data): SavingsGoal
    {
        $data['is_active'] = $data['is_active'] ?? true;
        $data['current_amount'] = $data['current_amount'] ?? 0;

        return DB::transaction(function () use ($user, $data) {
            $goal = new SavingsGoal($data);
            $goal->user_id = $user->id;
            $goal->save();

            return $goal;
        });
    }

    public function updateForUser(SavingsGoal $goal, array $data): SavingsGoal
    {
        return DB::transaction(function () use ($goal, $data) {
            $goal->update($data);
            return $goal->refresh();
        });
    }

    public function deleteForUser(SavingsGoal $goal): bool
    {
        return DB::transaction(function () use ($goal) {
            return $goal->delete();
        });
    }

    public function deposit(SavingsGoal $goal, float $amount): SavingsGoal
    {
        return DB::transaction(function () use ($goal, $amount) {
            return $goal->deposit($amount);
        });
    }

    public function withdraw(SavingsGoal $goal, float $amount): SavingsGoal
    {
        return DB::transaction(function () use ($goal, $amount) {
            return $goal->withdraw($amount);
        });
    }

    public function summaryForUser(int $userId): array
    {
        $goals = SavingsGoal::forUser($userId)->active()->get();

        $totalMontante = $goals->where('type', 'montante')->sum('current_amount');
        $totalPorquinho = $goals->where('type', 'porquinho')->sum('current_amount');
        $totalTargetMontante = $goals->where('type', 'montante')->sum('target_amount');
        $totalTargetPorquinho = $goals->where('type', 'porquinho')->sum('target_amount');
        $completedCount = $goals->whereNotNull('completed_at')->count();
        $activeCount = $goals->count();

        return [
            'total_saved'           => (float) ($totalMontante + $totalPorquinho),
            'total_montante'        => (float) $totalMontante,
            'total_porquinho'       => (float) $totalPorquinho,
            'total_target_montante' => (float) $totalTargetMontante,
            'total_target_porquinho'=> (float) $totalTargetPorquinho,
            'completed_count'       => $completedCount,
            'active_count'          => $activeCount,
        ];
    }
}

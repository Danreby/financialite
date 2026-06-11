<?php

namespace App\Services;

use App\Models\Budget;
use App\Models\Notification;
use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;

class BudgetAlertService
{
    private const DEFAULT_THRESHOLD = 90.0;

    public function __construct(private NotificationService $notifications) {}

    public function checkForUser(Authenticatable $user, float $threshold = self::DEFAULT_THRESHOLD): array
    {
        $currentMonth = Carbon::now()->format('Y-m');
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        $budget = Budget::where('user_id', $user->getAuthIdentifier())
            ->where('month_year', $currentMonth)
            ->where('is_active', true)
            ->where('monthly_limit', '>', 0)
            ->first();

        if (! $budget) {
            return ['threshold' => 0, 'exceeded' => 0, 'skipped' => 1];
        }

        return $this->evaluate($user, $budget, $threshold, $currentMonth, $startOfMonth, $endOfMonth);
    }

    public function checkAll(float $threshold = self::DEFAULT_THRESHOLD): array
    {
        $currentMonth = Carbon::now()->format('Y-m');
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        $budgets = Budget::with('user')
            ->where('month_year', $currentMonth)
            ->where('is_active', true)
            ->where('monthly_limit', '>', 0)
            ->get();

        $stats = ['threshold' => 0, 'exceeded' => 0, 'skipped' => 0, 'total' => $budgets->count()];

        foreach ($budgets as $budget) {
            if (! $budget->user) {
                $stats['skipped']++;

                continue;
            }

            $result = $this->evaluate(
                $budget->user,
                $budget,
                $threshold,
                $currentMonth,
                $startOfMonth,
                $endOfMonth
            );

            $stats['threshold'] += $result['threshold'];
            $stats['exceeded'] += $result['exceeded'];
            $stats['skipped'] += $result['skipped'];
        }

        return $stats;
    }

    private function evaluate(
        Authenticatable $user,
        Budget $budget,
        float $threshold,
        string $currentMonth,
        Carbon $startOfMonth,
        Carbon $endOfMonth
    ): array {
        $stats = ['threshold' => 0, 'exceeded' => 0, 'skipped' => 0];
        $userId = $user->getAuthIdentifier();
        $limit = (float) $budget->monthly_limit;

        if ($limit <= 0) {
            $stats['skipped']++;

            return $stats;
        }

        $totalSpent = (float) Transacao::where('user_id', $userId)
            ->where('type', 'debit')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $percentage = ($totalSpent / $limit) * 100;
        $formattedSpent = number_format($totalSpent, 2, ',', '.');
        $formattedLimit = number_format($limit, 2, ',', '.');
        $formattedPct = number_format($percentage, 1, ',', '.');
        $formattedRemaining = number_format(max(0.0, $limit - $totalSpent), 2, ',', '.');

        if ($percentage >= 100.0) {
            if ($this->alreadyNotified($userId, 'budget_exceeded', $currentMonth)) {
                $stats['skipped']++;

                return $stats;
            }

            $this->notifications->error(
                $user,
                'Orçamento estourado!',
                "Você gastou R$ {$formattedSpent} de um limite de R$ {$formattedLimit} ({$formattedPct}%). ".
                'Seu orçamento do mês foi ultrapassado.',
                sendEmail: true
            );

            $this->storeMeta($userId, 'budget_exceeded', $currentMonth);
            $stats['exceeded']++;

            return $stats;
        }

        if ($percentage >= $threshold) {
            if ($this->alreadyNotified($userId, 'budget_threshold', $currentMonth)) {
                $stats['skipped']++;

                return $stats;
            }

            $intThreshold = (int) $threshold;

            $this->notifications->warning(
                $user,
                "Orçamento a {$intThreshold}%",
                "Você já utilizou {$formattedPct}% do seu orçamento mensal ".
                "(R$ {$formattedSpent} de R$ {$formattedLimit}). ".
                "Restam apenas R$ {$formattedRemaining} disponíveis.",
                sendEmail: true
            );

            $this->storeMeta($userId, 'budget_threshold', $currentMonth);
            $stats['threshold']++;
        }

        return $stats;
    }

    private function alreadyNotified(int $userId, string $alertKey, string $month): bool
    {
        return Notification::where('user_id', $userId)
            ->where('title', $this->metaTitle($alertKey, $month))
            ->exists();
    }

    private function storeMeta(int $userId, string $alertKey, string $month): void
    {
        Notification::create([
            'user_id' => $userId,
            'title' => $this->metaTitle($alertKey, $month),
            'message' => '',
            'type' => 'info',
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    private function metaTitle(string $alertKey, string $month): string
    {
        return "__meta:{$alertKey}:{$month}";
    }
}

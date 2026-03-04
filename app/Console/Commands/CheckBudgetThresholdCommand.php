<?php

namespace App\Console\Commands;

use App\Models\Budget;
use App\Models\Notification;
use App\Models\Transacao;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckBudgetThresholdCommand extends Command
{
    protected $signature   = 'budget:check-threshold {--threshold=90 : Percentage threshold to trigger the alert}';
    protected $description = 'Verifica orçamentos que atingiram o limite configurado (padrão: 90%) e envia notificações';

    public function __construct(private NotificationService $notifications)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $threshold = (float) $this->option('threshold');

        if ($threshold <= 0 || $threshold > 100) {
            $this->error("Threshold inválido: {$threshold}. Use um valor entre 1 e 100.");
            return self::FAILURE;
        }

        $this->info("Verificando orçamentos acima de {$threshold}%...");

        $currentMonth   = Carbon::now()->format('Y-m');
        $startOfMonth   = Carbon::now()->startOfMonth();
        $endOfMonth     = Carbon::now()->endOfMonth();

        $budgets = Budget::with('user')
            ->where('month_year', $currentMonth)
            ->where('is_active', true)
            ->where('monthly_limit', '>', 0)
            ->get();

        $this->info("  Orçamentos ativos encontrados: {$budgets->count()}");

        $notifiedThreshold = 0;
        $notifiedExceeded  = 0;
        $skipped           = 0;

        foreach ($budgets as $budget) {
            if (! $budget->user) {
                continue;
            }

            $user  = $budget->user;
            $limit = (float) $budget->monthly_limit;

            $totalSpent = (float) Transacao::where('user_id', $user->id)
                ->where('type', 'debit')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->sum('amount');

            if ($limit <= 0) {
                continue;
            }

            $percentage = ($totalSpent / $limit) * 100;

            $formattedSpent  = number_format($totalSpent, 2, ',', '.');
            $formattedLimit  = number_format($limit, 2, ',', '.');
            $formattedPct    = number_format($percentage, 1, ',', '.');

            if ($percentage >= 100) {
                if ($this->alreadyNotifiedThisMonth($user->id, 'budget_exceeded', $currentMonth)) {
                    $this->line("  → Pulado (já notificado - estourado): {$user->name}");
                    $skipped++;
                    continue;
                }

                $this->notifications->error(
                    $user,
                    'Orçamento estourado!',
                    "Você gastou R$ {$formattedSpent} de um limite de R$ {$formattedLimit} ({$formattedPct}%). " .
                    'Seu orçamento do mês foi ultrapassado.'
                );

                $this->storeNotificationMeta($user->id, 'budget_exceeded', $currentMonth);
                $notifiedExceeded++;
                $this->line("  → Notificado (estourado): {$user->name} — {$formattedPct}%");

                continue;
            }

            if ($percentage >= $threshold) {
                if ($this->alreadyNotifiedThisMonth($user->id, 'budget_threshold', $currentMonth)) {
                    $this->line("  → Pulado (já notificado - {$threshold}%): {$user->name}");
                    $skipped++;
                    continue;
                }

                $remaining = max(0, $limit - $totalSpent);
                $formattedRemaining = number_format($remaining, 2, ',', '.');
                $intThreshold = (int) $threshold;

                $this->notifications->warning(
                    $user,
                    "Orçamento a {$intThreshold}%",
                    "Você já utilizou {$formattedPct}% do seu orçamento mensal " .
                    "(R$ {$formattedSpent} de R$ {$formattedLimit}). " .
                    "Restam apenas R$ {$formattedRemaining} disponíveis."
                );

                $this->storeNotificationMeta($user->id, 'budget_threshold', $currentMonth);
                $notifiedThreshold++;
                $this->line("  → Notificado ({$intThreshold}%): {$user->name} — {$formattedPct}%");
            }
        }

        $this->info('Processo concluído:');
        $this->info("  • {$notifiedThreshold} notificações de limite ({$threshold}%) enviadas");
        $this->info("  • {$notifiedExceeded} notificações de orçamento estourado enviadas");
        $this->info("  • {$skipped} já notificados anteriormente (ignorados)");

        return self::SUCCESS;
    }

    private function storeNotificationMeta(int $userId, string $alertKey, string $month): void
    {
        Notification::create([
            'user_id' => $userId,
            'title'   => $this->buildMetaTitle($alertKey, $month),
            'message' => '',
            'type'    => 'info',
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    private function alreadyNotifiedThisMonth(int $userId, string $alertKey, string $month): bool
    {
        return Notification::where('user_id', $userId)
            ->where('title', $this->buildMetaTitle($alertKey, $month))
            ->exists();
    }

    private function buildMetaTitle(string $alertKey, string $month): string
    {
        return "__meta:{$alertKey}:{$month}";
    }
}

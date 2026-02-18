<?php

namespace App\Console\Commands;

use App\Models\Bill;
use App\Models\User;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CheckUpcomingBillsCommand extends Command
{
    protected $signature = 'bills:check-upcoming';
    protected $description = 'Verifica contas próximas do vencimento e envia notificações';

    public function __construct(private NotificationService $notifications)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Verificando contas próximas do vencimento...');

        $today = Carbon::today();
        $oneDayFromNow = $today->copy()->addDay();
        $twoDaysFromNow = $today->copy()->addDays(2);

        // Buscar todas ascontas ativas
        $bills = Bill::with('user')
            ->where('status', 'active')
            ->get();

        $notified1Day = 0;
        $notified2Days = 0;

        foreach ($bills as $bill) {
            $nextDueDate = $bill->getNextDueDate();
            
            if (!$nextDueDate) {
                continue;
            }

            // Notificar 2 dias antes
            if ($nextDueDate->isSameDay($twoDaysFromNow)) {
                $this->notifications->warning(
                    $bill->user,
                    'Conta a vencer em 2 dias',
                    "A conta \"{$bill->title}\" vence em " . $nextDueDate->format('d/m/Y') . 
                    ($bill->amount ? " no valor de R$ " . number_format($bill->amount, 2, ',', '.') : '') . '.'
                );
                $notified2Days++;
                $this->line("  → Notificado: {$bill->user->name} - {$bill->title} (2 dias)");
            }

            // Notificar 1 dia antes
            if ($nextDueDate->isSameDay($oneDayFromNow)) {
                $this->notifications->warning(
                    $bill->user,
                    'Conta a vencer amanhã',
                    "A conta \"{$bill->title}\" vence amanhã (" . $nextDueDate->format('d/m/Y') . ')' .
                    ($bill->amount ? " no valor de R$ " . number_format($bill->amount, 2, ',', '.') : '') . '.'
                );
                $notified1Day++;
                $this->line("  → Notificado: {$bill->user->name} - {$bill->title} (1 dia)");
            }
        }

        $this->info("Processo concluído:");
        $this->info("  • {$notified2Days} notificações enviadas (2 dias antes)");
        $this->info("  • {$notified1Day} notificações enviadas (1 dia antes)");

        return self::SUCCESS;
    }
}

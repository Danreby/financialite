<?php

namespace App\Console\Commands;

use App\Models\CardUser;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CheckCardClosingDayCommand extends Command
{
    protected $signature = 'cards:check-closing-day';
    protected $description = 'Verifica cartões próximos do fechamento e envia notificações';

    public function __construct(private NotificationService $notifications)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Verificando cartões próximos do fechamento...');

        $today = Carbon::today();
        $todayDay    = (int) $today->format('d');
        $oneDayAhead = (int) $today->copy()->addDay()->format('d');
        $twoDaysAhead = (int) $today->copy()->addDays(2)->format('d');

        $notified1Day  = 0;
        $notified2Days = 0;
        $notifiedToday = 0;

        // Load all active card users that have a closing_day set
        $cardUsers = CardUser::with(['card', 'user'])
            ->whereNotNull('closing_day')
            ->get();

        foreach ($cardUsers as $cardUser) {
            if (!$cardUser->user || !$cardUser->card) {
                continue;
            }

            $closingDay = (int) $cardUser->closing_day;
            $cardName   = $cardUser->card->name ?? ('Cartão #' . $cardUser->id);

            // Notify 2 days before closing
            if ($closingDay === $twoDaysAhead) {
                $this->notifications->warning(
                    $cardUser->user,
                    'Fechamento em 2 dias',
                    "O cartão {$cardName} fecha em 2 dias (dia {$closingDay}). " .
                    'Compras feitas após o fechamento entrarão na próxima fatura.'
                );
                $notified2Days++;
                $this->line("  → Notificado: {$cardUser->user->name} - {$cardName} (2 dias)");
            }

            // Notify 1 day before closing
            if ($closingDay === $oneDayAhead) {
                $this->notifications->warning(
                    $cardUser->user,
                    'Fechamento amanhã',
                    "O cartão {$cardName} fecha amanhã (dia {$closingDay}). " .
                    'Compras feitas após o fechamento entrarão na próxima fatura.'
                );
                $notified1Day++;
                $this->line("  → Notificado: {$cardUser->user->name} - {$cardName} (1 dia)");
            }

            // Notify on the closing day itself
            if ($closingDay === $todayDay) {
                $this->notifications->info(
                    $cardUser->user,
                    'Cartão fecha hoje',
                    "O cartão {$cardName} fecha HOJE (dia {$closingDay}). " .
                    'Compras feitas a partir de agora entrarão na próxima fatura.'
                );
                $notifiedToday++;
                $this->line("  → Notificado: {$cardUser->user->name} - {$cardName} (HOJE)");
            }
        }

        $this->info('Processo concluído:');
        $this->info("  • {$notified2Days} notificações enviadas (2 dias antes)");
        $this->info("  • {$notified1Day} notificações enviadas (1 dia antes)");
        $this->info("  • {$notifiedToday} notificações enviadas (fecha hoje)");

        return self::SUCCESS;
    }
}

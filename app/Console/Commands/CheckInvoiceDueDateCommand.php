<?php

namespace App\Console\Commands;

use App\Models\Fatura;
use App\Models\User;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CheckInvoiceDueDateCommand extends Command
{
    protected $signature = 'invoices:check-due-date';
    protected $description = 'Verifica faturas próximas do vencimento e envia notificações';

    public function __construct(private NotificationService $notifications)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Verificando faturas próximas do vencimento...');

        $today = Carbon::today();
        $oneDayFromNow = $today->copy()->addDay();
        $twoDaysFromNow = $today->copy()->addDays(2);

        $invoices = Fatura::with('user', 'bankUser.card')
            ->whereNull('paid_at')
            ->whereHas('bankUser', function($q) {
                $q->whereNotNull('due_day');
            })
            ->get();

        $notified1Day = 0;
        $notified2Days = 0;
        $notifiedToday = 0;

        foreach ($invoices as $invoice) {
            if (!$invoice->bankUser || !$invoice->bankUser->due_day) {
                continue;
            }

            $invoiceDate = Carbon::parse($invoice->month_key . '-01');
            $dueDate = $invoiceDate->copy()->addMonth()->day(min($invoice->bankUser->due_day, $invoiceDate->copy()->addMonth()->daysInMonth));
            
            if ($dueDate->isSameDay($twoDaysFromNow)) {
                $bankName = $invoice->bankUser?->card?->name ?? 'Cartão';
                $monthLabel = $invoiceDate->translatedFormat('F/Y');
                
                $this->notifications->warning(
                    $invoice->user,
                    'Fatura vence em 2 dias',
                    "A fatura do {$bankName} ({$monthLabel}) vence em " . $dueDate->format('d/m/Y') . 
                    " no valor de R$ " . number_format($invoice->total_paid, 2, ',', '.') . '.'
                );
                $notified2Days++;
                $this->line("  → Notificado: {$invoice->user->name} - {$bankName} {$monthLabel} (2 dias)");
            }

            if ($dueDate->isSameDay($oneDayFromNow)) {
                $bankName = $invoice->bankUser?->card?->name ?? 'Cartão';
                $monthLabel = $invoiceDate->translatedFormat('F/Y');
                
                $this->notifications->warning(
                    $invoice->user,
                    'Fatura vence amanhã',
                    "A fatura do {$bankName} ({$monthLabel}) vence amanhã (" . $dueDate->format('d/m/Y') . ')' .
                    " no valor de R$ " . number_format($invoice->total_paid, 2, ',', '.') . '.'
                );
                $notified1Day++;
                $this->line("  → Notificado: {$invoice->user->name} - {$bankName} {$monthLabel} (1 dia)");
            }

            if ($dueDate->isSameDay($today)) {
                $bankName = $invoice->bankUser?->card?->name ?? 'Cartão';
                $monthLabel = $invoiceDate->translatedFormat('F/Y');
                
                $this->notifications->error(
                    $invoice->user,
                    'Fatura vence hoje',
                    "A fatura do {$bankName} ({$monthLabel}) vence HOJE (" . $dueDate->format('d/m/Y') . ')' .
                    " no valor de R$ " . number_format($invoice->total_paid, 2, ',', '.') . '. Não se esqueça de pagar!'
                );
                $notifiedToday++;
                $this->line("  → Notificado: {$invoice->user->name} - {$bankName} {$monthLabel} (HOJE)");
            }
        }

        $this->info("Processo concluído:");
        $this->info("  • {$notified2Days} notificações enviadas (2 dias antes)");
        $this->info("  • {$notified1Day} notificações enviadas (1 dia antes)");
        $this->info("  • {$notifiedToday} notificações enviadas (vence hoje)");

        return self::SUCCESS;
    }
}

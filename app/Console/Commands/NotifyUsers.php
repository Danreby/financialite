<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Throwable;

class NotifyUsers extends Command
{
    protected $signature = 'notify:users';

    protected $description = 'Executa todas as verificações de notificação para os usuários (contas, faturas, cartões, orçamentos)';

    private array $pipeline = [
        'bills:check-upcoming' => 'Contas a vencer',
        'invoices:check-due-date' => 'Faturas a vencer',
        'cards:check-closing-day' => 'Fechamento de cartões',
        'budget:check-threshold' => 'Limite de orçamento',
    ];

    public function handle(): int
    {
        $this->info('========================================');
        $this->info('  Iniciando envio de notificações diárias');
        $this->info('  '.now()->format('d/m/Y H:i:s'));
        $this->info('========================================');

        $errors = 0;

        foreach ($this->pipeline as $command => $label) {
            $this->newLine();
            $this->line("▶ [{$label}]");

            try {
                $exitCode = Artisan::call($command, [], $this->output);

                if ($exitCode !== self::SUCCESS) {
                    $this->warn("  ⚠ Comando '{$command}' encerrou com código {$exitCode}.");
                    $errors++;
                }
            } catch (Throwable $e) {
                $this->error("  ✗ Falha ao executar '{$command}': {$e->getMessage()}");
                $errors++;
            }
        }

        $this->newLine();
        $this->info('========================================');

        if ($errors > 0) {
            $this->warn("Concluído com {$errors} erro(s). Verifique os logs.");

            return self::FAILURE;
        }

        $this->info('Todas as notificações foram processadas com sucesso.');

        return self::SUCCESS;
    }
}

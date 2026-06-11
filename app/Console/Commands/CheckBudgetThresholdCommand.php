<?php

namespace App\Console\Commands;

use App\Services\BudgetAlertService;
use Illuminate\Console\Command;

class CheckBudgetThresholdCommand extends Command
{
    protected $signature = 'budget:check-threshold {--threshold=90 : Percentage threshold to trigger the alert}';

    protected $description = 'Varredura diária: verifica orçamentos que atingiram o limite configurado (padrão: 90%) e envia notificações';

    public function __construct(private BudgetAlertService $budgetAlert)
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

        $stats = $this->budgetAlert->checkAll($threshold);

        $this->info("  Orçamentos ativos encontrados: {$stats['total']}");
        $this->info('Processo concluído:');
        $this->info("  • {$stats['threshold']} notificações de limite ({$threshold}%) enviadas");
        $this->info("  • {$stats['exceeded']} notificações de orçamento estourado enviadas");
        $this->info("  • {$stats['skipped']} já notificados anteriormente (ignorados)");

        return self::SUCCESS;
    }
}

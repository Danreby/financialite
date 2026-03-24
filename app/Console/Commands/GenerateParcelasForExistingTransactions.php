<?php

namespace App\Console\Commands;

use App\Models\Transacao;
use App\Services\FaturaService;
use Illuminate\Console\Command;

class GenerateParcelasForExistingTransactions extends Command
{
    protected $signature = 'parcelas:generate';
    protected $description = 'Gera parcelas para transações existentes que ainda não possuem parcelas';

    public function handle(FaturaService $faturaService): int
    {
        $transacoes = Transacao::whereDoesntHave('parcelas')
            ->where('is_recurring', false)
            ->get();

        if ($transacoes->isEmpty()) {
            $this->info('Nenhuma transação sem parcelas encontrada.');
            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($transacoes->count());
        $bar->start();

        $count = 0;
        foreach ($transacoes as $transacao) {
            $faturaService->createParcelas($transacao);
            $count++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Parcelas geradas para {$count} transações.");

        return self::SUCCESS;
    }
}

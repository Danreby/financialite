<?php

namespace App\Console\Commands;

use App\Models\Transacao;
use App\Models\TransacaoParcela;
use App\Services\FaturaService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncTransacaoParcelasCommand extends Command
{
    protected $signature = 'parcelas:sync';
    protected $description = 'Verifica e sincroniza parcelas de todas as transações, criando registros faltantes e corrigindo inconsistências';

    public function handle(FaturaService $faturaService): int
    {
        $this->info('Iniciando sincronização de parcelas...');

        $created = 0;
        $recreated = 0;
        $skipped = 0;

        // 1. Transactions without any parcelas (non-recurring).
        $withoutParcelas = Transacao::whereDoesntHave('parcelas')
            ->where('is_recurring', false)
            ->get();

        if ($withoutParcelas->isNotEmpty()) {
            $this->info("Criando parcelas para {$withoutParcelas->count()} transações sem parcelas...");

            foreach ($withoutParcelas as $transacao) {
                $faturaService->createParcelas($transacao);
                $created++;
            }
        }

        // 2. Transactions with parcelas that don't match (wrong count or missing month_key).
        $withParcelas = Transacao::with('parcelas')
            ->where('is_recurring', false)
            ->whereHas('parcelas')
            ->get();

        foreach ($withParcelas as $transacao) {
            $totalInstallments = max((int) $transacao->total_installments, 1);
            $parcelas = $transacao->parcelas;
            $needsRecreation = false;

            // Check: parcela count matches total_installments.
            if ($parcelas->count() !== $totalInstallments) {
                $needsRecreation = true;
            }

            // Check: all parcelas have month_key.
            if (!$needsRecreation && $parcelas->contains(fn ($p) => empty($p->month_key))) {
                $needsRecreation = true;
            }

            // Check: amounts sum matches transaction amount (within tolerance).
            if (!$needsRecreation) {
                $parcelasSum = (float) $parcelas->sum('amount');
                $transacaoAmount = (float) $transacao->amount;
                if (abs($parcelasSum - $transacaoAmount) > 0.02) {
                    $needsRecreation = true;
                }
            }

            // Check: installment numbers are sequential 1..N.
            if (!$needsRecreation) {
                $numbers = $parcelas->pluck('installment_number')->sort()->values()->all();
                $expected = range(1, $totalInstallments);
                if ($numbers !== $expected) {
                    $needsRecreation = true;
                }
            }

            if ($needsRecreation) {
                // Preserve paid status of existing parcelas before recreation.
                $paidStatuses = $parcelas
                    ->where('status', 'paid')
                    ->pluck('paid_date', 'installment_number')
                    ->all();

                $transacao->parcelas()->delete();
                $faturaService->createParcelas($transacao);

                // Re-apply paid status to recreated parcelas.
                if (!empty($paidStatuses)) {
                    foreach ($paidStatuses as $installmentNumber => $paidDate) {
                        TransacaoParcela::where('transacao_id', $transacao->id)
                            ->where('installment_number', $installmentNumber)
                            ->update([
                                'status' => 'paid',
                                'paid_date' => $paidDate,
                            ]);
                    }
                }

                $recreated++;
            } else {
                $skipped++;
            }
        }

        $total = $created + $recreated;
        $this->info("Sincronização concluída: {$created} criadas, {$recreated} recriadas, {$skipped} já corretas.");

        if ($total > 0) {
            Log::info("parcelas:sync — {$created} criadas, {$recreated} recriadas, {$skipped} corretas.");
        }

        return self::SUCCESS;
    }
}

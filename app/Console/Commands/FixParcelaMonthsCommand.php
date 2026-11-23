<?php

namespace App\Console\Commands;

use App\Enums\TransacaoParcelaStatus;
use App\Models\Transacao;
use App\Models\TransacaoParcela;
use App\Services\FaturaBillingService;
use App\Services\FaturaService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Corrige parcelas gravadas com o mês de fatura errado pelo antigo cálculo de
 * meses com transbordo (compras de 29 a 31 depois do fechamento pulavam um mês).
 *
 * Sem --apply só lista o que mudaria. Com --apply corrige apenas compras sem
 * nenhuma parcela paga; as demais ficam listadas para revisão manual, porque
 * mover uma parcela paga mudaria o histórico de faturas já quitadas.
 */
class FixParcelaMonthsCommand extends Command
{
    protected $signature = 'parcelas:corrigir-meses {--apply : Grava as correções (sem esta opção nada é alterado)}';

    protected $description = 'Confere o mês de fatura das parcelas já gravadas e corrige as que saíram erradas no fim do mês';

    public function handle(FaturaService $faturaService, FaturaBillingService $billing): int
    {
        $apply = (bool) $this->option('apply');
        $fixed = 0;
        $review = 0;
        $rows = [];

        Transacao::query()
            ->where('is_recurring', false)
            ->whereNotNull('bank_user_id')
            ->whereHas('parcelas')
            ->with(['parcelas', 'bankUser'])
            ->lazyById()
            ->each(function (Transacao $transacao) use ($faturaService, $billing, $apply, &$fixed, &$review, &$rows) {
                $parcelas = $transacao->parcelas->keyBy('installment_number');

                if ((int) $transacao->total_installments <= 1) {
                    // À vista: o vencimento é a data da compra; só o mês da fatura pode estar errado.
                    $only = $parcelas->first();
                    $expected = collect([1 => [
                        'month_key' => $billing->resolveBillingMonthKey($transacao),
                        'due_date' => $only->due_date->toDateString(),
                    ]]);
                } else {
                    $expected = collect($faturaService->buildInstallmentSchedule($transacao))->keyBy('installment_number');
                }

                if ($parcelas->count() !== $expected->count()) {
                    return; // contagem divergente é caso do parcelas:sync
                }

                $wrong = $parcelas->filter(function (TransacaoParcela $parcela, int $number) use ($expected) {
                    return $parcela->month_key !== $expected[$number]['month_key']
                        || $parcela->due_date->toDateString() !== $expected[$number]['due_date'];
                });

                if ($wrong->isEmpty()) {
                    return;
                }

                $first = $parcelas->sortKeys()->first();
                $hasPaid = $parcelas->contains(fn (TransacaoParcela $p) => $p->status === TransacaoParcelaStatus::Paid);

                $rows[] = [
                    $transacao->id,
                    $transacao->user_id,
                    $transacao->title,
                    $first->month_key.' → '.$expected[$first->installment_number]['month_key'],
                    $hasPaid ? 'revisar manualmente (tem parcela paga)' : ($apply ? 'corrigida' : 'será corrigida'),
                ];

                if ($hasPaid) {
                    $review++;

                    return;
                }

                if ($apply) {
                    DB::transaction(function () use ($wrong, $expected) {
                        foreach ($wrong as $number => $parcela) {
                            $parcela->update([
                                'month_key' => $expected[$number]['month_key'],
                                'due_date' => $expected[$number]['due_date'],
                            ]);
                        }
                    });
                }

                $fixed++;
            });

        if ($rows !== []) {
            $this->table(['Transação', 'Usuário', 'Compra', '1ª parcela', 'Situação'], $rows);
        }

        $this->info(($apply ? 'Corrigidas: ' : 'A corrigir: ')."{$fixed} compra(s). Para revisar manualmente: {$review}.");

        if (! $apply) {
            $this->line('Nada foi alterado. Rode com --apply para gravar as correções.');
        }

        return self::SUCCESS;
    }
}

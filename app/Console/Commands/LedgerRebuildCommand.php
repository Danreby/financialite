<?php

namespace App\Console\Commands;

use App\Models\BankUser;
use App\Models\Fatura;
use App\Services\BankLedgerService;
use App\Services\FaturaLedgerService;
use App\Support\Money;
use Illuminate\Console\Command;

class LedgerRebuildCommand extends Command
{
    protected $signature = 'ledger:rebuild {--dry-run : Only report divergences without fixing them}';

    protected $description = 'Recalcula o saldo de contas bancárias e o total pago de faturas a partir do ledger de eventos, reportando e corrigindo divergências';

    public function handle(BankLedgerService $ledger, FaturaLedgerService $faturaLedger): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $divergences = 0;

        $divergences += $this->reconcileBankAccounts($ledger, $dryRun);
        $divergences += $this->reconcileFaturas($faturaLedger, $dryRun);

        if ($divergences === 0) {
            $this->info('Nenhuma divergência encontrada. Ledger e valores em cache estão consistentes.');
        } else {
            $this->warn($dryRun
                ? "{$divergences} divergência(s) encontrada(s) (nada foi alterado — remova --dry-run para corrigir)."
                : "{$divergences} divergência(s) encontrada(s) e corrigida(s).");
        }

        return self::SUCCESS;
    }

    private function reconcileBankAccounts(BankLedgerService $ledger, bool $dryRun): int
    {
        $count = 0;

        BankUser::chunkById(100, function ($bankUsers) use (&$count, $ledger, $dryRun) {
            foreach ($bankUsers as $bankUser) {
                $cached = Money::fromDecimal((string) ($bankUser->balance ?? '0'));
                $computed = $ledger->ledgerSumCents($bankUser->id);

                if ($cached === $computed) {
                    continue;
                }

                $count++;
                $this->line("  🏦  BankUser #{$bankUser->id}: cache R$ ".number_format($cached / 100, 2, ',', '.').
                    ' ≠ eventos R$ '.number_format($computed / 100, 2, ',', '.'));

                if (! $dryRun) {
                    $ledger->rebuildBalance($bankUser);
                }
            }
        });

        return $count;
    }

    private function reconcileFaturas(FaturaLedgerService $faturaLedger, bool $dryRun): int
    {
        $count = 0;

        Fatura::chunkById(100, function ($faturas) use (&$count, $faturaLedger, $dryRun) {
            foreach ($faturas as $fatura) {
                $cached = Money::fromDecimal((string) ($fatura->total_paid ?? '0'));
                $computed = $faturaLedger->totalPaidCents($fatura->id);

                if ($cached === $computed) {
                    continue;
                }

                $count++;
                $this->line("  🧾  Fatura #{$fatura->id} ({$fatura->month_key}): cache R$ ".number_format($cached / 100, 2, ',', '.').
                    ' ≠ eventos R$ '.number_format($computed / 100, 2, ',', '.'));

                if (! $dryRun) {
                    $fatura->total_paid = Money::toDecimal($computed);
                    $fatura->save();
                }
            }
        });

        return $count;
    }
}

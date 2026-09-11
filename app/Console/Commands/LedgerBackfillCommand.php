<?php

namespace App\Console\Commands;

use App\Models\BankLedgerEntry;
use App\Models\BankUser;
use App\Models\Fatura;
use App\Models\FaturaPaymentEvent;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class LedgerBackfillCommand extends Command
{
    protected $signature = 'ledger:backfill {--dry-run : Preview without making changes}';

    protected $description = 'Cria eventos de abertura para saldos e pagamentos de fatura existentes que ainda não têm histórico no ledger';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $accountsCreated = $this->backfillBankAccounts($dryRun);
        $faturasCreated = $this->backfillFaturas($dryRun);

        $this->info($dryRun
            ? "[DRY-RUN] {$accountsCreated} conta(s) e {$faturasCreated} fatura(s) receberiam evento de saldo migrado."
            : "{$accountsCreated} conta(s) e {$faturasCreated} fatura(s) receberam evento de saldo migrado.");

        return self::SUCCESS;
    }

    private function backfillBankAccounts(bool $dryRun): int
    {
        $count = 0;

        BankUser::whereDoesntHave('ledgerEntries')
            ->where('balance', '!=', 0)
            ->chunkById(100, function ($bankUsers) use (&$count, $dryRun) {
                foreach ($bankUsers as $bankUser) {
                    $balance = round((float) $bankUser->balance, 2);
                    $this->line("  🏦  BankUser #{$bankUser->id} → saldo migrado: R$ ".number_format($balance, 2, ',', '.'));

                    if (! $dryRun) {
                        DB::transaction(function () use ($bankUser, $balance) {
                            BankLedgerEntry::create([
                                'user_id' => $bankUser->user_id,
                                'bank_user_id' => $bankUser->id,
                                'type' => BankLedgerEntry::TYPE_ACCOUNT_OPENING,
                                'amount' => $balance,
                                'balance_after' => $balance,
                                'description' => 'Saldo migrado (histórico anterior ao ledger)',
                                'created_at' => $bankUser->created_at ?? now(),
                            ]);
                        });
                    }

                    $count++;
                }
            });

        return $count;
    }

    private function backfillFaturas(bool $dryRun): int
    {
        $count = 0;

        Fatura::whereDoesntHave('paymentEvents')
            ->where('total_paid', '>', 0)
            ->chunkById(100, function ($faturas) use (&$count, $dryRun) {
                foreach ($faturas as $fatura) {
                    $amount = round((float) $fatura->total_paid, 2);
                    $this->line("  🧾  Fatura #{$fatura->id} ({$fatura->month_key}) → pagamento migrado: R$ ".number_format($amount, 2, ',', '.'));

                    if (! $dryRun) {
                        FaturaPaymentEvent::create([
                            'fatura_id' => $fatura->id,
                            'type' => FaturaPaymentEvent::TYPE_PAYMENT,
                            'amount' => $amount,
                            'description' => 'Pagamento migrado (histórico anterior ao ledger)',
                            'created_at' => $fatura->paid_at ?? $fatura->created_at ?? now(),
                        ]);
                    }

                    $count++;
                }
            });

        return $count;
    }
}

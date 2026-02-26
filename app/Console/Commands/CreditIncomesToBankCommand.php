<?php

namespace App\Console\Commands;

use App\Models\BankUser;
use App\Models\Income;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CreditIncomesToBankCommand extends Command
{
    protected $signature   = 'incomes:credit-to-bank {--dry-run : Preview without making changes}';
    protected $description = 'Credita automaticamente os valores de receitas recorrentes no saldo da conta bancária vinculada no dia de pagamento configurado';

    public function __construct(private NotificationService $notifications)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $today   = Carbon::today();
        $dryRun  = $this->option('dry-run');
        $credited = 0;
        $skipped  = 0;

        $this->info($dryRun
            ? "[DRY-RUN] Simulando crédito de receitas para {$today->format('d/m/Y')}..."
            : "Creditando receitas para {$today->format('d/m/Y')}...");

        $incomes = Income::with(['bankAccount', 'user'])
            ->where('is_active', true)
            ->where('is_recurring', true)
            ->whereNotNull('bank_account_id')
            ->get();

        foreach ($incomes as $income) {
            $bankUser = $income->bankAccount;

            if (! $bankUser instanceof BankUser) {
                $skipped++;
                continue;
            }

            if ($income->received_at && $income->received_at->isSameDay($today)) {
                $this->line("  ⏭  Já creditado hoje: [{$income->id}] {$income->title}");
                $skipped++;
                continue;
            }

            if (! $this->isPaymentDay($income, $today)) {
                $skipped++;
                continue;
            }

            $amount = (float) $income->amount;

            $this->line(sprintf(
                '  %s  [%d] %s → R$ %s → Conta #%d (%s)',
                $dryRun ? '🔍' : '✅',
                $income->id,
                $income->title,
                number_format($amount, 2, ',', '.'),
                $bankUser->id,
                $bankUser->bank?->name ?? 'Banco'
            ));

            if (! $dryRun) {
                DB::transaction(function () use ($income, $bankUser, $amount, $today) {
                    $bankUser->increment('balance', $amount);

                    $income->received_at = $today;
                    $income->saveQuietly();

                    $this->notifications->success(
                        $income->user,
                        'Receita creditada',
                        sprintf(
                            'R$ %s de "%s" foi creditado na conta %s.',
                            number_format($amount, 2, ',', '.'),
                            $income->title,
                            $bankUser->bank?->name ?? 'bancária'
                        )
                    );
                });
            }

            $credited++;
        }

        $this->info($dryRun
            ? "[DRY-RUN] {$credited} receita(s) seriam creditadas, {$skipped} ignoradas."
            : "{$credited} receita(s) creditada(s) com sucesso, {$skipped} ignoradas.");

        return self::SUCCESS;
    }

    private function isPaymentDay(Income $income, Carbon $today): bool
    {
        $value = (int) $income->payment_day_value;

        if ($income->payment_day_type === 'fixed') {
            $effectiveDay = min($value, $today->daysInMonth);

            return $today->day === $effectiveDay;
        }

        if ($income->payment_day_type === 'business_day') {
            $nthBusinessDay = $this->getNthBusinessDay($today->year, $today->month, $value);

            return $nthBusinessDay !== null && $today->isSameDay($nthBusinessDay);
        }

        return false;
    }

    private function getNthBusinessDay(int $year, int $month, int $n): ?Carbon
    {
        if ($n < 1) {
            return null;
        }

        $cursor  = Carbon::create($year, $month, 1)->startOfDay();
        $end     = $cursor->copy()->endOfMonth();
        $counted = 0;

        while ($cursor->lte($end)) {
            if ($cursor->isWeekday()) {
                $counted++;
                if ($counted === $n) {
                    return $cursor->copy();
                }
            }
            $cursor->addDay();
        }

        return null;
    }
}

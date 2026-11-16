<?php

namespace App\Services;

use App\Exceptions\InsufficientBalanceException;
use App\Models\BankLedgerEntry;
use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Fatura;
use App\Models\FaturaPaymentEvent;
use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

class FaturaPaymentService
{
    public function __construct(
        private FaturaBillingService $billing,
        private BankLedgerService $ledger,
        private FaturaLedgerService $faturaLedger,
    ) {}

    public function payMonthForUser(Authenticatable $user, string $monthKey, ?CardUser $cardUser, ?BankUser $bankAccount = null): float
    {
        $bankUserId = $cardUser?->id;
        $targetMonth = Carbon::parse($monthKey.'-01');

        return DB::transaction(function () use ($user, $bankUserId, $monthKey, $targetMonth, $bankAccount) {
            $allFaturas = Transacao::with(['bankUser', 'parcelas'])
                ->forUser($user->id)
                ->forBankUser($bankUserId)
                ->notStatus('paid')
                ->lockForUpdate()
                ->get();

            $faturas = $allFaturas->filter(fn (Transacao $transacao) => $this->billing->faturaAppliesToMonth($transacao, $targetMonth));

            if ($faturas->isEmpty()) {
                return 0.0;
            }

            $existingFatura = Fatura::where([
                'user_id' => $user->id,
                'month_key' => $monthKey,
                'bank_user_id' => $bankUserId,
            ])->lockForUpdate()->first();
            $alreadyPaidCents = $existingFatura ? $this->toCents($existingFatura->total_paid ?? 0) : 0;

            $totalPaidThisRun = 0.0;
            foreach ($faturas as $transacao) {
                $totalPaidThisRun += $this->billing->applyPaymentForMonth($transacao, $monthKey);
                $transacao->save();
            }

            // Pagamentos parciais anteriores já foram debitados: cobra só o restante.
            $totalCents = max(0, $this->toCents($totalPaidThisRun) - $alreadyPaidCents);
            if ($totalCents <= 0) {
                return 0.0;
            }

            $lockedAccount = $bankAccount ? $this->lockAccount($bankAccount) : null;
            if ($lockedAccount) {
                $this->assertCanDebit($lockedAccount, $totalCents);
            }

            $paid = $existingFatura ?? new Fatura([
                'user_id' => $user->id,
                'month_key' => $monthKey,
                'bank_user_id' => $bankUserId,
            ]);

            if (! $paid->exists) {
                $paid->total_paid = 0;
                $paid->save();
            }

            $paidAmount = $totalCents / 100;

            $ledgerEntry = null;
            if ($lockedAccount) {
                $ledgerEntry = $this->ledger->record(
                    $lockedAccount,
                    BankLedgerEntry::TYPE_INVOICE_PAYMENT,
                    -$paidAmount,
                    $paid,
                    "Pagamento de fatura ({$monthKey})"
                );
                $bankAccount->balance = $lockedAccount->balance;
            }

            $this->faturaLedger->recordPaymentEvent(
                $paid,
                $paidAmount,
                FaturaPaymentEvent::TYPE_PAYMENT,
                null,
                $ledgerEntry,
                "Pagamento de fatura ({$monthKey})"
            );

            $paid->paid_at = now();
            $paid->save();

            return $paidAmount;
        });
    }

    public function payPartialForUser(
        Authenticatable $user,
        string $monthKey,
        float $amount,
        ?CardUser $cardUser,
        ?BankUser $bankAccount = null
    ): array {
        $bankUserId = $cardUser?->id;
        $targetMonth = Carbon::parse($monthKey.'-01');

        return DB::transaction(function () use ($user, $bankUserId, $monthKey, $targetMonth, $amount, $bankAccount) {
            $allTransacoes = Transacao::with(['bankUser', 'parcelas'])
                ->forUser($user->id)
                ->forBankUser($bankUserId)
                ->lockForUpdate()
                ->get();

            $totalDueCents = 0;
            foreach ($allTransacoes as $transacao) {
                if ($this->billing->faturaAppliesToMonth($transacao, $targetMonth)) {
                    $installmentNumber = $this->billing->resolveInstallmentNumberForMonth($transacao, $monthKey);
                    $totalDueCents += $this->toCents($transacao->getInstallmentAmount($installmentNumber));
                }
            }

            if ($totalDueCents <= 0) {
                throw new \DomainException('Nenhuma transação encontrada para este mês.');
            }

            $faturaRecord = Fatura::where([
                'user_id' => $user->id,
                'month_key' => $monthKey,
                'bank_user_id' => $bankUserId,
            ])->lockForUpdate()->first() ?? new Fatura([
                'user_id' => $user->id,
                'month_key' => $monthKey,
                'bank_user_id' => $bankUserId,
            ]);

            $remainingCents = max(0, $totalDueCents - $this->toCents($faturaRecord->total_paid ?? 0));

            if ($remainingCents <= 0) {
                throw new \DomainException('Esta fatura já foi totalmente paga.');
            }

            $payCents = min($this->toCents($amount), $remainingCents);
            if ($payCents <= 0) {
                throw new \DomainException('Informe um valor maior que zero.');
            }

            $lockedAccount = $bankAccount ? $this->lockAccount($bankAccount) : null;
            if ($lockedAccount) {
                $this->assertCanDebit($lockedAccount, $payCents);
            }

            if (! $faturaRecord->exists) {
                $faturaRecord->total_paid = 0;
                $faturaRecord->save();
            }

            $payAmount = $payCents / 100;

            $ledgerEntry = null;
            if ($lockedAccount) {
                $ledgerEntry = $this->ledger->record(
                    $lockedAccount,
                    BankLedgerEntry::TYPE_INVOICE_PAYMENT,
                    -$payAmount,
                    $faturaRecord,
                    "Pagamento parcial de fatura ({$monthKey})"
                );
                $bankAccount->balance = $lockedAccount->balance;
            }

            $this->faturaLedger->recordPaymentEvent(
                $faturaRecord,
                $payAmount,
                FaturaPaymentEvent::TYPE_PAYMENT,
                null,
                $ledgerEntry,
                "Pagamento parcial de fatura ({$monthKey})"
            );

            if ($this->toCents($faturaRecord->total_paid) >= $totalDueCents) {
                $faturaRecord->paid_at = now();
                $faturaRecord->save();
            }

            return [
                'total_paid' => (float) $faturaRecord->total_paid,
                'total_due' => $totalDueCents / 100,
                'amount_paid_now' => $payAmount,
                'is_fully_paid' => $faturaRecord->paid_at !== null,
            ];
        });
    }

    private function toCents(float|int|string|null $value): int
    {
        return (int) round(((float) $value) * 100);
    }

    /** Relê a conta dentro da transação, com lock, para decidir pelo saldo real. */
    private function lockAccount(BankUser $bankAccount): BankUser
    {
        return BankUser::with('bank')->whereKey($bankAccount->id)->lockForUpdate()->firstOrFail();
    }

    private function assertCanDebit(BankUser $lockedAccount, int $debitCents): void
    {
        $balanceCents = $this->toCents($lockedAccount->balance);

        if ($balanceCents < $debitCents) {
            throw new InsufficientBalanceException(
                $lockedAccount->bank?->name ?? 'bancária',
                $debitCents - max(0, $balanceCents)
            );
        }
    }
}

<?php

namespace App\Services;

use App\Enums\TransacaoParcelaStatus;
use App\Enums\TransacaoStatus;
use App\Exceptions\InsufficientBalanceException;
use App\Models\BankLedgerEntry;
use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Fatura;
use App\Models\FaturaPaymentEvent;
use App\Models\Transacao;
use App\Support\Money;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;
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
            // Trava todas as transações do cartão, pagas ou não: o total devido do mês
            // considera todos os itens, e o que já foi pago entra pelo total_paid.
            $allTransacoes = Transacao::with(['bankUser', 'parcelas'])
                ->forUser($user->id)
                ->forBankUser($bankUserId)
                ->lockForUpdate()
                ->get();

            $faturas = $allTransacoes
                ->filter(fn (Transacao $transacao) => $transacao->status !== TransacaoStatus::Paid)
                ->filter(fn (Transacao $transacao) => $this->billing->faturaAppliesToMonth($transacao, $targetMonth));

            if ($faturas->isEmpty()) {
                return 0.0;
            }

            $existingFatura = Fatura::where([
                'user_id' => $user->id,
                'month_key' => $monthKey,
                'bank_user_id' => $bankUserId,
            ])->lockForUpdate()->first();

            // Calcula antes de marcar os itens como pagos.
            $totalCents = $this->outstandingCents($allTransacoes, $targetMonth, $monthKey, $existingFatura);

            foreach ($faturas as $transacao) {
                $this->billing->applyPaymentForMonth($transacao, $monthKey);
                $transacao->save();
            }

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

            $ledgerEntry = null;
            if ($lockedAccount) {
                $ledgerEntry = $this->ledger->recordCents(
                    $lockedAccount,
                    BankLedgerEntry::TYPE_INVOICE_PAYMENT,
                    -$totalCents,
                    $paid,
                    "Pagamento de fatura ({$monthKey})"
                );
                $bankAccount->balance = $lockedAccount->balance;
            }

            $this->faturaLedger->recordPaymentEventCents(
                $paid,
                $totalCents,
                FaturaPaymentEvent::TYPE_PAYMENT,
                null,
                $ledgerEntry,
                "Pagamento de fatura ({$monthKey})"
            );

            $paid->paid_at = now();
            $paid->save();

            return $totalCents / 100;
        });
    }

    public function payPartialForUser(
        Authenticatable $user,
        string $monthKey,
        string|int|float $amount,
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

            $totalDueCents = $this->monthTotalsCents($allTransacoes, $targetMonth, $monthKey)['due'];

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

            $remainingCents = $this->outstandingCents($allTransacoes, $targetMonth, $monthKey, $faturaRecord);

            if ($remainingCents <= 0) {
                throw new \DomainException('Esta fatura já foi totalmente paga.');
            }

            $payCents = min(Money::fromDecimal($amount), $remainingCents);
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

            $ledgerEntry = null;
            if ($lockedAccount) {
                $ledgerEntry = $this->ledger->recordCents(
                    $lockedAccount,
                    BankLedgerEntry::TYPE_INVOICE_PAYMENT,
                    -$payCents,
                    $faturaRecord,
                    "Pagamento parcial de fatura ({$monthKey})"
                );
                $bankAccount->balance = $lockedAccount->balance;
            }

            $this->faturaLedger->recordPaymentEventCents(
                $faturaRecord,
                $payCents,
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
                'total_paid' => $this->toCents($faturaRecord->total_paid) / 100,
                'total_due' => $totalDueCents / 100,
                'amount_paid_now' => $payCents / 100,
                'is_fully_paid' => $faturaRecord->paid_at !== null,
            ];
        });
    }

    /**
     * Totais do mês em centavos, sobre todos os itens que caem nele (pagos ou não).
     * "due" é o valor da fatura do mês; "settled" é a parte dos itens já marcados
     * como pagos (status da transação ou da parcela do mês). Recorrentes não são
     * marcados como pagos pelo pagamento da fatura, então só entram em "due".
     *
     * @return array{due: int, settled: int}
     */
    private function monthTotalsCents(Collection $transacoes, Carbon $targetMonth, string $monthKey): array
    {
        $due = 0;
        $settled = 0;

        foreach ($transacoes as $transacao) {
            if (! $this->billing->faturaAppliesToMonth($transacao, $targetMonth)) {
                continue;
            }

            $installmentNumber = $this->billing->resolveInstallmentNumberForMonth($transacao, $monthKey);
            $amountCents = $transacao->getInstallmentAmountCents($installmentNumber);
            $due += $amountCents;

            if ($this->isSettledForMonth($transacao, $monthKey, $installmentNumber)) {
                $settled += $amountCents;
            }
        }

        return ['due' => $due, 'settled' => $settled];
    }

    /**
     * Quanto falta pagar no mês. O já pago é o maior entre o total_paid da fatura e
     * os itens marcados como pagos, para não cobrar de novo um item quitado fora da
     * fatura (ex.: transação cadastrada como paga).
     */
    private function outstandingCents(Collection $transacoes, Carbon $targetMonth, string $monthKey, ?Fatura $fatura): int
    {
        $totals = $this->monthTotalsCents($transacoes, $targetMonth, $monthKey);
        $paidCents = $this->toCents($fatura?->total_paid ?? 0);

        return max(0, $totals['due'] - max($paidCents, $totals['settled']));
    }

    private function isSettledForMonth(Transacao $transacao, string $monthKey, ?int $installmentNumber): bool
    {
        if ($transacao->status === TransacaoStatus::Paid) {
            return true;
        }

        if ($transacao->is_recurring) {
            return false;
        }

        if ($installmentNumber === null) {
            return false;
        }

        $parcela = $transacao->parcelas->firstWhere('month_key', $monthKey)
            ?? $transacao->parcelas->firstWhere('installment_number', $installmentNumber);

        if ($parcela) {
            return $parcela->status === TransacaoParcelaStatus::Paid;
        }

        return (int) ($transacao->current_installment ?? 0) >= $installmentNumber;
    }

    private function toCents(string|int|float|null $value): int
    {
        return Money::fromDecimal($value ?? 0);
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

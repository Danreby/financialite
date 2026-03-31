<?php

namespace App\Services;

use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Fatura;
use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

class FaturaPaymentService
{
    public function __construct(private FaturaBillingService $billing)
    {
    }

    public function payMonthForUser(Authenticatable $user, string $monthKey, ?CardUser $cardUser, ?BankUser $bankAccount = null): float
    {
        $bankUserId = $cardUser?->id;

        $query = Transacao::with(['bankUser', 'parcelas'])
            ->forUser($user->id)
            ->forBankUser($bankUserId)
            ->notStatus('paid');

        $allFaturas = $query->get();

        $targetMonth = Carbon::parse($monthKey . '-01');

        $faturas = $allFaturas->filter(function (Transacao $transacao) use ($targetMonth) {
            return $this->billing->faturaAppliesToMonth($transacao, $targetMonth);
        });

        if ($faturas->isEmpty()) {
            return 0.0;
        }

        return DB::transaction(function () use ($faturas, $user, $bankUserId, $monthKey, $bankAccount) {
            $totalPaidThisRun = 0.0;

            // Check if this month already has a payment record (re-payment scenario).
            $existingFatura = Fatura::where([
                'user_id' => $user->id,
                'month_key' => $monthKey,
                'bank_user_id' => $bankUserId,
            ])->first();
            $hasExistingPayment = $existingFatura && (float) ($existingFatura->total_paid ?? 0) > 0;

            foreach ($faturas as $transacao) {
                // Recurring transactions were already included in the first payment.
                // Skip them on re-payment to avoid double-counting in total_paid.
                if ($transacao->is_recurring && $hasExistingPayment) {
                    continue;
                }

                $totalPaidThisRun += $this->billing->applyPaymentForMonth($transacao, $monthKey);
                $transacao->save();
            }

            if ($totalPaidThisRun > 0) {
                $paid = Fatura::firstOrNew([
                    'user_id' => $user->id,
                    'month_key' => $monthKey,
                    'bank_user_id' => $bankUserId,
                ]);

                // Accumulate: previous partial payments must be preserved.
                $paid->total_paid = (float) ($paid->total_paid ?? 0.0) + $totalPaidThisRun;
                $paid->paid_at = now();
                $paid->save();

                if ($bankAccount) {
                    $bankAccount->balance = max(0, (float) $bankAccount->balance - $totalPaidThisRun);
                    $bankAccount->save();
                }
            }

            return (float) $totalPaidThisRun;
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

        $targetMonth = Carbon::parse($monthKey . '-01');

        $allTransacoes = Transacao::with(['bankUser', 'parcelas'])
            ->forUser($user->id)
            ->forBankUser($bankUserId)
            ->get();

        $totalDue = 0.0;
        foreach ($allTransacoes as $transacao) {
            if ($this->billing->faturaAppliesToMonth($transacao, $targetMonth)) {
                $installmentNumber = $this->billing->resolveInstallmentNumberForMonth($transacao, $monthKey);
                $totalDue += (float) $transacao->getInstallmentAmount($installmentNumber);
            }
        }

        if ($totalDue <= 0) {
            throw new \DomainException('Nenhuma transação encontrada para este mês.');
        }

        return DB::transaction(function () use ($user, $bankUserId, $monthKey, $amount, $bankAccount, $totalDue) {
            $faturaRecord = Fatura::firstOrNew([
                'user_id'      => $user->id,
                'month_key'    => $monthKey,
                'bank_user_id' => $bankUserId,
            ]);

            $alreadyPaid = (float) ($faturaRecord->total_paid ?? 0);
            $remaining   = max(0.0, $totalDue - $alreadyPaid);

            if ($remaining <= 0) {
                throw new \DomainException('Esta fatura já foi totalmente paga.');
            }

            $payAmount = min($amount, $remaining);

            $faturaRecord->total_paid = $alreadyPaid + $payAmount;

            if ($faturaRecord->total_paid >= $totalDue) {
                $faturaRecord->paid_at = now();
            }

            $faturaRecord->save();

            if ($bankAccount) {
                $bankAccount->balance = max(0.0, (float) $bankAccount->balance - $payAmount);
                $bankAccount->save();
            }

            return [
                'total_paid'      => (float) $faturaRecord->total_paid,
                'total_due'       => $totalDue,
                'amount_paid_now' => $payAmount,
                'is_fully_paid'   => $faturaRecord->paid_at !== null,
            ];
        });
    }
}

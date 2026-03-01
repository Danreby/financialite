<?php

namespace App\Services;

use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Fatura;
use App\Models\Transacao;
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

        $query = Transacao::with('bankUser')
            ->forUser($user->id)
            ->forBankUser($bankUserId)
            ->notStatus('paid');

        $allFaturas = $query->get();

        $targetMonth = now()->createFromFormat('Y-m', $monthKey)->startOfMonth();

        $faturas = $allFaturas->filter(function (Transacao $transacao) use ($targetMonth) {
            return $this->billing->faturaAppliesToMonth($transacao, $targetMonth);
        });

        if ($faturas->isEmpty()) {
            return 0.0;
        }

        return DB::transaction(function () use ($faturas, $user, $bankUserId, $monthKey, $bankAccount) {
            $totalPaidThisRun = 0.0;

            foreach ($faturas as $transacao) {
                $totalPaidThisRun += $this->billing->applyPaymentForMonth($transacao);
                $transacao->save();
            }

            if ($totalPaidThisRun > 0) {
                $paid = Fatura::firstOrNew([
                    'user_id' => $user->id,
                    'month_key' => $monthKey,
                    'bank_user_id' => $bankUserId,
                ]);

                $paid->total_paid = ($paid->total_paid ?? 0) + $totalPaidThisRun;
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
}

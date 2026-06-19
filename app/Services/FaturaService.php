<?php

namespace App\Services;

use App\Contracts\Services\FaturaServiceInterface;
use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Fatura;
use App\Models\Transacao;
use App\Models\TransacaoParcela;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

class FaturaService implements FaturaServiceInterface
{
    public function __construct(private FaturaBillingService $billing) {}

    public function createForUser(Authenticatable $user, array $data): Transacao
    {
        $debitAccountId = $data['debit_account_id'] ?? null;
        unset($data['debit_account_id']);

        $data['user_id'] = $user->id;
        $data['total_installments'] = max($data['total_installments'] ?? 1, 1);
        $data['current_installment'] = 0;
        $data['status'] = $data['status'] ?? 'unpaid';
        $data['is_recurring'] = $data['is_recurring'] ?? false;

        if ($data['is_recurring']) {
            $data['total_installments'] = 1;
            $data['current_installment'] = 0;
        }

        if (($data['type'] ?? null) === 'debit') {
            $data['status'] = 'paid';
            $data['paid_date'] = Carbon::today()->toDateString();
            $data['total_installments'] = 1;
            $data['current_installment'] = 1;
            $data['is_recurring'] = false;
        }

        $amount = (float) ($data['amount'] ?? 0);

        return DB::transaction(function () use ($data, $debitAccountId, $user, $amount) {
            $fatura = Transacao::create($data);

            $this->createParcelas($fatura);

            if ($debitAccountId && $amount > 0) {
                $bankAccount = BankUser::forUser($user->id)->findOrFail($debitAccountId);
                $bankAccount->balance = max(0, (float) $bankAccount->balance - $amount);
                $bankAccount->save();
            }

            return $fatura;
        });
    }

    public function updateForUser(Transacao $fatura, array $data): Transacao
    {
        return DB::transaction(function () use ($fatura, $data) {
            $oldAmount = (float) $fatura->amount;
            $oldInstallments = (int) $fatura->total_installments;
            $wasPaid = $fatura->paid_date !== null;
            $wasRecurring = (bool) $fatura->is_recurring;

            $fatura->update($data);

            if ($fatura->is_recurring) {
                $fatura->total_installments = 1;
                $fatura->current_installment = 0;
                $fatura->paid_date = null;
                $fatura->save();
            }

            $newAmount = (float) $fatura->amount;
            $newInstallments = (int) $fatura->total_installments;

            if ($oldAmount !== $newAmount || $oldInstallments !== $newInstallments) {
                $fatura->parcelas()->delete();
                $this->createParcelas($fatura);
            }

            if ($wasPaid && $fatura->paid_date === null && ! $wasRecurring) {
                $this->resetFaturaPaymentOnUnpaid($fatura);
            }

            return $fatura->refresh();
        });
    }

    private function resetFaturaPaymentOnUnpaid(Transacao $transacao): void
    {
        $transacao->loadMissing(['bankUser', 'parcelas']);
        $parcelas = $transacao->parcelas;

        $transacao->parcelas()
            ->where('status', 'paid')
            ->update(['status' => 'pending', 'paid_date' => null]);

        $transacao->current_installment = 0;
        $transacao->save();

        if ($parcelas->isNotEmpty()) {
            $entries = $parcelas
                ->filter(fn ($p) => $p->month_key !== null)
                ->map(fn ($p) => ['month_key' => $p->month_key, 'amount' => (float) $p->amount])
                ->values();
        } else {
            try {
                $monthKey = $this->billing->resolveBillingMonthKey($transacao);
            } catch (\Throwable) {
                $monthKey = $transacao->created_at->format('Y-m');
            }
            $entries = collect([['month_key' => $monthKey, 'amount' => (float) $transacao->amount]]);
        }

        foreach ($entries as $entry) {
            $faturaRecord = Fatura::where([
                'user_id' => $transacao->user_id,
                'month_key' => $entry['month_key'],
                'bank_user_id' => $transacao->bank_user_id,
            ])->first();

            if (! $faturaRecord) {
                continue;
            }

            $newTotal = max(0.0, (float) ($faturaRecord->total_paid ?? 0) - $entry['amount']);
            $faturaRecord->total_paid = $newTotal;

            if ($newTotal < 0.01) {
                $faturaRecord->paid_at = null;
                $faturaRecord->total_paid = 0;
            }

            $faturaRecord->save();
        }
    }

    public function createParcelas(Transacao $transacao): void
    {
        $totalInstallments = max((int) $transacao->total_installments, 1);
        $totalAmount = (float) $transacao->amount;

        $firstBillingMonthKey = $this->billing->resolveBillingMonthKey($transacao);

        if ($totalInstallments <= 1 && ! $transacao->is_recurring) {
            TransacaoParcela::create([
                'transacao_id' => $transacao->id,
                'installment_number' => 1,
                'amount' => $totalAmount,
                'due_date' => $transacao->created_at
                    ? $transacao->created_at->toDateString()
                    : Carbon::today()->toDateString(),
                'month_key' => $firstBillingMonthKey,
                'status' => $transacao->status === 'paid' ? 'paid' : 'pending',
                'paid_date' => $transacao->status === 'paid' ? ($transacao->paid_date ?? now())->toDateString() : null,
            ]);

            return;
        }

        if ($transacao->is_recurring) {
            return;
        }

        $baseAmount = round($totalAmount / $totalInstallments, 2);
        $remainder = round($totalAmount - ($baseAmount * $totalInstallments), 2);

        $createdAt = $transacao->created_at
            ? ($transacao->created_at instanceof Carbon ? $transacao->created_at : Carbon::parse($transacao->created_at))
            : Carbon::today();

        $cardUser = $transacao->bank_user_id
            ? CardUser::find($transacao->bank_user_id)
            : null;

        $dueDay = $cardUser->due_day ?? $cardUser->closing_day ?? (int) $createdAt->format('d');

        $firstBillingMonth = Carbon::parse($firstBillingMonthKey.'-01');

        $parcelas = [];
        for ($i = 1; $i <= $totalInstallments; $i++) {
            $parcelaAmount = $baseAmount;
            if ($i === $totalInstallments) {
                $parcelaAmount = round($parcelaAmount + $remainder, 2);
            }

            $parcelMonth = $firstBillingMonth->copy()->addMonths($i - 1);
            $monthKey = $parcelMonth->format('Y-m');
            $maxDay = (int) $parcelMonth->copy()->endOfMonth()->format('d');
            $actualDueDay = min($dueDay, $maxDay);
            $dueDate = $parcelMonth->copy()->setDay($actualDueDay);

            $parcelas[] = [
                'transacao_id' => $transacao->id,
                'installment_number' => $i,
                'amount' => $parcelaAmount,
                'due_date' => $dueDate->toDateString(),
                'month_key' => $monthKey,
                'status' => 'pending',
                'paid_date' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        TransacaoParcela::insert($parcelas);
    }

    public function deleteForUser(Transacao $fatura): bool
    {
        return DB::transaction(function () use ($fatura) {
            return $fatura->delete();
        });
    }
}

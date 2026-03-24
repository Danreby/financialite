<?php

namespace App\Services;

use App\Contracts\Services\FaturaServiceInterface;
use App\Models\BankUser;
use App\Models\Transacao;
use App\Models\TransacaoParcela;
use App\Models\CardUser;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

class FaturaService implements FaturaServiceInterface
{
    public function __construct(private FaturaBillingService $billing)
    {
    }

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

            return $fatura->refresh();
        });
    }

    public function createParcelas(Transacao $transacao): void
    {
        $totalInstallments = max((int) $transacao->total_installments, 1);
        $totalAmount = (float) $transacao->amount;

        if ($totalInstallments <= 1 && !$transacao->is_recurring) {
            TransacaoParcela::create([
                'transacao_id' => $transacao->id,
                'installment_number' => 1,
                'amount' => $totalAmount,
                'due_date' => $transacao->created_at
                    ? $transacao->created_at->toDateString()
                    : Carbon::today()->toDateString(),
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
        $closingDay = $cardUser->closing_day ?? $dueDay;

        $firstBillingMonth = $createdAt->day <= $closingDay
            ? $createdAt->copy()->startOfMonth()
            : $createdAt->copy()->addMonth()->startOfMonth();

        $parcelas = [];
        for ($i = 1; $i <= $totalInstallments; $i++) {
            $parcelaAmount = $baseAmount;
            if ($i === $totalInstallments) {
                $parcelaAmount = round($parcelaAmount + $remainder, 2);
            }

            $parcelMonth = $firstBillingMonth->copy()->addMonths($i - 1);
            $maxDay = (int) $parcelMonth->copy()->endOfMonth()->format('d');
            $actualDueDay = min($dueDay, $maxDay);
            $dueDate = $parcelMonth->copy()->setDay($actualDueDay);

            $parcelas[] = [
                'transacao_id' => $transacao->id,
                'installment_number' => $i,
                'amount' => $parcelaAmount,
                'due_date' => $dueDate->toDateString(),
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

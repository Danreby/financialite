<?php

namespace App\Services;

use App\Contracts\Services\FaturaServiceInterface;
use App\Models\BankUser;
use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;

class FaturaService implements FaturaServiceInterface
{
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
            $fatura->update($data);

            if ($fatura->is_recurring) {
                $fatura->total_installments = 1;
                $fatura->current_installment = 0;
                $fatura->paid_date = null;
                $fatura->save();
            }

            return $fatura->refresh();
        });
    }

    public function deleteForUser(Transacao $fatura): bool
    {
        return DB::transaction(function () use ($fatura) {
            return $fatura->delete();
        });
    }
}

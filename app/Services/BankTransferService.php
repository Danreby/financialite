<?php

namespace App\Services;

use App\Contracts\Services\BankTransferServiceInterface;
use App\Models\BankTransfer;
use App\Models\BankUser;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class BankTransferService implements BankTransferServiceInterface
{
    public function transfer(Authenticatable $user, array $data): BankTransfer
    {
        return DB::transaction(function () use ($user, $data) {
            $fromAccount = BankUser::forUser($user->id)->findOrFail($data['from_bank_user_id']);
            $toAccount   = BankUser::forUser($user->id)->findOrFail($data['to_bank_user_id']);
            $amount      = (float) $data['amount'];

            $fromAccount->decrement('balance', $amount);
            $toAccount->increment('balance', $amount);

            return BankTransfer::create([
                'user_id'            => $user->id,
                'from_bank_user_id'  => $fromAccount->id,
                'to_bank_user_id'    => $toAccount->id,
                'amount'             => $amount,
                'description'        => $data['description'] ?? null,
            ]);
        });
    }

    public function listForUser(int $userId, int $limit = 20): Collection
    {
        return BankTransfer::with(['fromBankUser.bank', 'toBankUser.bank'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}

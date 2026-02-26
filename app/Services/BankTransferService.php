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
    protected const DEFAULT_LIMIT = 20;

    public function transfer(Authenticatable $user, array $data): BankTransfer
    {
        return DB::transaction(function () use ($user, $data) {
            $fromId = (int) $data['from_bank_user_id'];
            $toId   = (int) $data['to_bank_user_id'];
            $amount = (float) $data['amount'];

            if ($fromId === $toId) {
                throw new \DomainException('A conta de origem e destino não podem ser a mesma.');
            }

            if ($amount <= 0) {
                throw new \DomainException('O valor da transferência deve ser maior que zero.');
            }

            $lockIds = [$fromId, $toId];
            sort($lockIds);

            $accounts = BankUser::forUser($user->id)
                ->whereIn('id', $lockIds)
                ->lockForUpdate()
                ->orderBy('id')
                ->get()
                ->keyBy('id');

            if ($accounts->count() !== 2) {
                throw new \DomainException('Uma ou ambas as contas não foram encontradas.');
            }

            $fromAccount = $accounts->get($fromId);
            $toAccount   = $accounts->get($toId);

            if ((float) $fromAccount->balance < $amount) {
                throw new \DomainException('Saldo insuficiente para realizar a transferência.');
            }

            $fromAccount->decrement('balance', $amount);
            $toAccount->increment('balance', $amount);

            return BankTransfer::create([
                'user_id'            => $user->id,
                'from_bank_user_id'  => $fromAccount->id,
                'to_bank_user_id'    => $toAccount->id,
                'amount'             => $amount,
                'description'        => isset($data['description']) ? trim($data['description']) : null,
            ]);
        });
    }

    public function listForUser(int $userId, ?int $bankUserId = null): Collection
    {
        $query = BankTransfer::with(['fromBankUser.bank', 'toBankUser.bank'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc');

        if (!is_null($bankUserId)) {
            $query->where(function ($q) use ($bankUserId) {
                $q->where('from_bank_user_id', $bankUserId)
                  ->orWhere('to_bank_user_id', $bankUserId);
            });
        }

        return $query->limit(self::DEFAULT_LIMIT)->get();
    }
}
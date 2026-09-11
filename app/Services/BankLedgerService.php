<?php

namespace App\Services;

use App\Models\BankLedgerEntry;
use App\Models\BankUser;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class BankLedgerService
{
    /**
     * Appends an immutable ledger entry for a bank account and moves the account's
     * cached balance to match. This is the ONLY place allowed to write BankUser::balance.
     */
    public function record(
        BankUser $bankUser,
        string $type,
        float $amount,
        ?Model $source = null,
        ?string $description = null
    ): BankLedgerEntry {
        return DB::transaction(function () use ($bankUser, $type, $amount, $source, $description) {
            $locked = BankUser::whereKey($bankUser->id)->lockForUpdate()->firstOrFail();

            $newBalance = round((float) $locked->balance + $amount, 2);

            $entry = BankLedgerEntry::create([
                'user_id' => $locked->user_id,
                'bank_user_id' => $locked->id,
                'type' => $type,
                'amount' => round($amount, 2),
                'balance_after' => $newBalance,
                'source_type' => $source?->getMorphClass(),
                'source_id' => $source?->getKey(),
                'description' => $description,
                'created_at' => now(),
            ]);

            $locked->balance = $newBalance;
            $locked->save();

            $bankUser->balance = $newBalance;

            return $entry;
        });
    }

    public function statementForAccount(BankUser $bankUser, int $perPage = 30): LengthAwarePaginator
    {
        return BankLedgerEntry::forBankUser($bankUser->id)
            ->recent()
            ->paginate($perPage);
    }

    /**
     * Unified activity feed across every bank account owned by the user,
     * newest first, with the originating account eager-loaded for display.
     */
    public function statementForUser(int $userId, int $perPage = 20): LengthAwarePaginator
    {
        return BankLedgerEntry::query()
            ->whereHas('bankUser', fn ($q) => $q->where('user_id', $userId))
            ->with('bankUser.bank')
            ->recent()
            ->paginate($perPage);
    }

    /**
     * Recomputes a bank account's cached balance from its ledger entries.
     * Used for reconciliation (php artisan ledger:rebuild) and as a safety net.
     */
    public function rebuildBalance(BankUser $bankUser): BankUser
    {
        return DB::transaction(function () use ($bankUser) {
            $locked = BankUser::whereKey($bankUser->id)->lockForUpdate()->firstOrFail();

            $total = round((float) BankLedgerEntry::forBankUser($locked->id)->sum('amount'), 2);

            $locked->balance = $total;
            $locked->save();

            return $locked;
        });
    }
}

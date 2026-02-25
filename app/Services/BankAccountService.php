<?php

namespace App\Services;

use App\Contracts\Services\BankAccountServiceInterface;
use App\Models\Bank;
use App\Models\BankUser;
use App\Models\Income;
use App\Models\Transacao;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class BankAccountService implements BankAccountServiceInterface
{
    public function listForUser(int $userId): Collection
    {
        return BankUser::with('bank')
            ->forUser($userId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getStats(int $userId): array
    {
        $bankUsers = BankUser::with('bank')
            ->forUser($userId)
            ->get();

        $totalBalance = $bankUsers->sum('balance');
        $totalIncomes = Income::forUser($userId)
            ->whereNotNull('bank_account_id')
            ->whereIn('bank_account_id', $bankUsers->pluck('id'))
            ->active()
            ->sum('amount');

        return [
            'total_balance'  => round((float) $totalBalance, 2),
            'total_accounts' => $bankUsers->count(),
            'total_incomes'  => round((float) $totalIncomes, 2),
            'accounts'       => $bankUsers->map(fn (BankUser $bu) => $this->mapBankUserStats($bu, $userId)),
        ];
    }

    public function getBankDetail(int $userId, int $bankUserId): array
    {
        $bankUser = BankUser::with('bank')
            ->forUser($userId)
            ->findOrFail($bankUserId);

        return $this->mapBankUserStats($bankUser, $userId);
    }

    public function createForUser(Authenticatable $user, array $data): BankUser
    {
        return DB::transaction(function () use ($user, $data) {
            $bank = Bank::firstOrCreate(
                ['name' => $data['name']],
                ['name' => $data['name']]
            );

            return BankUser::create([
                'bank_id'  => $bank->id,
                'user_id'  => $user->id,
                'balance'  => $data['balance'] ?? 0,
            ]);
        });
    }

    public function updateBalance(BankUser $bankUser, float $newBalance): BankUser
    {
        return DB::transaction(function () use ($bankUser, $newBalance) {
            $bankUser->balance = $newBalance;
            $bankUser->save();
            return $bankUser->refresh();
        });
    }

    public function deleteForUser(BankUser $bankUser): bool
    {
        return DB::transaction(function () use ($bankUser) {
            return $bankUser->delete();
        });
    }

    public function totalBalance(int $userId): float
    {
        return (float) BankUser::forUser($userId)->sum('balance');
    }

    private function mapBankUserStats(BankUser $bankUser, int $userId): array
    {
        $incomeCount = Income::forUser($userId)
            ->where('bank_account_id', $bankUser->id)
            ->active()
            ->count();

        $incomeTotal = Income::forUser($userId)
            ->where('bank_account_id', $bankUser->id)
            ->active()
            ->sum('amount');

        return [
            'id'            => $bankUser->id,
            'bank_id'       => $bankUser->bank_id,
            'bank_name'     => $bankUser->bank->name ?? 'Banco',
            'balance'       => round((float) $bankUser->balance, 2),
            'income_count'  => $incomeCount,
            'income_total'  => round((float) $incomeTotal, 2),
            'created_at'    => $bankUser->created_at?->toIso8601String(),
        ];
    }
}

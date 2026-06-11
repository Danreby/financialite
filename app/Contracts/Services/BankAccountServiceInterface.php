<?php

namespace App\Contracts\Services;

use App\Models\BankUser;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;

interface BankAccountServiceInterface
{
    public function listForUser(int $userId): Collection;

    public function getStats(int $userId): array;

    public function getBankDetail(int $userId, int $bankUserId): array;

    public function createForUser(Authenticatable $user, array $data): BankUser;

    public function updateBalance(BankUser $bankUser, float $newBalance): BankUser;

    public function deleteForUser(BankUser $bankUser): bool;

    public function totalBalance(int $userId): float;
}

<?php

namespace App\Contracts\Services;

use App\Models\BankTransfer;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;

interface BankTransferServiceInterface
{
    public function transfer(Authenticatable $user, array $data): BankTransfer;

    public function listForUser(int $userId, ?int $bankUserId = null): Collection;
}

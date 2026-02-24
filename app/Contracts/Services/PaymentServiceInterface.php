<?php

namespace App\Contracts\Services;

use App\Models\CardUser;
use Illuminate\Contracts\Auth\Authenticatable;

interface PaymentServiceInterface
{
    public function payMonthForUser(
        Authenticatable $user,
        string $monthKey,
        ?CardUser $cardUser
    ): PaymentResult;
}

class PaymentResult
{
    public function __construct(
        public readonly float $totalPaid,
        public readonly int $itemsProcessed,
        public readonly bool $isFullyPaid,
        public readonly ?string $errorMessage = null
    ) {}

    public static function success(float $totalPaid, int $itemsProcessed): self
    {
        return new self($totalPaid, $itemsProcessed, true);
    }

    public static function partial(float $totalPaid, int $itemsProcessed): self
    {
        return new self($totalPaid, $itemsProcessed, false);
    }

    public static function empty(): self
    {
        return new self(0.0, 0, true);
    }

    public static function failed(string $message): self
    {
        return new self(0.0, 0, false, $message);
    }
}

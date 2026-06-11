<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankTransfer extends Model
{
    protected $table = 'bank_transfers';

    protected $fillable = [
        'user_id',
        'from_bank_user_id',
        'to_bank_user_id',
        'amount',
        'description',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'user_id' => 'integer',
        'from_bank_user_id' => 'integer',
        'to_bank_user_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fromBankUser(): BelongsTo
    {
        return $this->belongsTo(BankUser::class, 'from_bank_user_id');
    }

    public function toBankUser(): BelongsTo
    {
        return $this->belongsTo(BankUser::class, 'to_bank_user_id');
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function belongsToUser(int $userId): bool
    {
        return $this->user_id === $userId;
    }
}

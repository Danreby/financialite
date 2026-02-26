<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankUser extends Model
{
    protected $table = 'bank_user';

    protected $fillable = [
        'bank_id',
        'user_id',
        'balance',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'bank_id' => 'integer',
        'user_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function incomes(): HasMany
    {
        return $this->hasMany(Income::class, 'bank_account_id');
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForBank(Builder $query, int $bankId): Builder
    {
        return $query->where('bank_id', $bankId);
    }

    public function belongsToUser(int $userId): bool
    {
        return $this->user_id === $userId;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Fatura extends Model
{
    use HasFactory;

    protected $table = 'faturas';

    protected $fillable = [
        'user_id',
        'month_key',
        'bank_user_id',
        'paid_at',
        'total_paid',
    ];

    protected $hidden = [
        'deleted_at',
    ];

    protected $casts = [
        'paid_at' => 'date',
        'total_paid' => 'decimal:2',
        'user_id' => 'integer',
        'bank_user_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bankUser(): BelongsTo
    {
        return $this->belongsTo(CardUser::class);
    }

    public function transacoes(): BelongsToMany
    {
        return $this->belongsToMany(Transacao::class, 'fatura_transacao', 'fatura_id', 'transacao_id')->withTimestamps();
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForBankUser(Builder $query, ?int $bankUserId): Builder
    {
        if ($bankUserId === null) {
            return $query;
        }

        return $query->where('bank_user_id', $bankUserId);
    }

    public function scopeForMonth(Builder $query, string $monthKey): Builder
    {
        return $query->where('month_key', $monthKey);
    }

    public function scopePaid(Builder $query): Builder
    {
        return $query->whereNotNull('paid_at');
    }

    public function scopeUnpaid(Builder $query): Builder
    {
        return $query->whereNull('paid_at');
    }

    public function scopeRecent(Builder $query): Builder
    {
        return $query->orderBy('created_at', 'desc');
    }

    public function belongsToUser(int $userId): bool
    {
        return $this->user_id === $userId;
    }

    public function isPaid(): bool
    {
        return $this->paid_at !== null;
    }
}

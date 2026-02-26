<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Transacao;

class CardUser extends Model
{
    protected $table = 'card_user';

    protected $fillable = [
        'card_id',
        'user_id',
        'due_day',
        'closing_day',
        'credit_limit',
    ];

    protected $casts = [
        'due_day'      => 'integer',
        'closing_day'  => 'integer',
        'credit_limit' => 'decimal:2',
        'card_id'      => 'integer',
        'user_id'      => 'integer',
        'created_at'   => 'datetime',
        'updated_at'   => 'datetime',
    ];

    public function card(): BelongsTo
    {
        return $this->belongsTo(Card::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transacoes(): HasMany
    {
        return $this->hasMany(Transacao::class, 'bank_user_id');
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForCard(Builder $query, int $cardId): Builder
    {
        return $query->where('card_id', $cardId);
    }

    public function belongsToUser(int $userId): bool
    {
        return $this->user_id === $userId;
    }
}

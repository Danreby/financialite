<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use SoftDeletes;

    protected $table = 'categories';

    public const VALID_TYPES = ['income', 'expense'];

    public const TYPE_LABELS = [
        'income' => 'Receita',
        'expense' => 'Despesa',
    ];

    protected $fillable = [
        'name',
        'color',
        'icon',
        'type',
        'user_id',
    ];

    protected $hidden = [
        'deleted_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function scopeOfType(Builder $query, string $type): Builder
    {
        if (in_array($type, self::VALID_TYPES, true)) {
            return $query->where('type', $type);
        }

        return $query;
    }

    public function getTypeLabelAttribute(): string
    {
        return self::TYPE_LABELS[$this->type] ?? 'Despesa';
    }

    public function transacoes(): HasMany
    {
        return $this->hasMany(Transacao::class, 'category_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('name');
    }

    public function belongsToUser(int $userId): bool
    {
        return $this->user_id === $userId;
    }
}

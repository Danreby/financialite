<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'message',
        'type',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'user_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public const VALID_TYPES = ['info', 'warning', 'error', 'success'];

    /** Prefixo das linhas internas de controle (ex.: alertas de orçamento já enviados). */
    public const META_PREFIX = '__meta:';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Sem as linhas internas `__meta:`. Compara o prefixo com SUBSTR em vez de
     * LIKE, porque em LIKE o "_" é curinga e "xxmeta:..." também seria escondido.
     */
    public function scopeVisible(Builder $query): Builder
    {
        return $query->whereRaw('SUBSTR(title, 1, '.strlen(self::META_PREFIX).') <> ?', [self::META_PREFIX]);
    }

    public function scopeUnread(Builder $query): Builder
    {
        return $query->where('is_read', false);
    }

    public function belongsToUser(int $userId): bool
    {
        return $this->user_id === $userId;
    }

    public function markAsRead(): bool
    {
        return $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }
}

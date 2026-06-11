<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SavingsGoal extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'savings_goals';

    protected $fillable = [
        'title',
        'description',
        'target_amount',
        'current_amount',
        'icon',
        'color',
        'is_active',
        'completed_at',
    ];

    protected $hidden = [
        'deleted_at',
    ];

    protected $appends = [
        'is_completed',
        'progress',
        'remaining',
    ];

    protected $casts = [
        'target_amount' => 'decimal:2',
        'current_amount' => 'decimal:2',
        'is_active' => 'boolean',
        'user_id' => 'integer',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->whereNotNull('completed_at');
    }

    public function scopeIncomplete(Builder $query): Builder
    {
        return $query->whereNull('completed_at');
    }

    public function belongsToUser(int $userId): bool
    {
        return $this->user_id === $userId;
    }

    public function getProgressAttribute(): float
    {
        if ((float) $this->target_amount <= 0) {
            return 0;
        }

        $progress = ((float) $this->current_amount / (float) $this->target_amount) * 100;

        return min(round($progress, 1), 100);
    }

    public function getRemainingAttribute(): float
    {
        return max((float) $this->target_amount - (float) $this->current_amount, 0);
    }

    public function getIsCompletedAttribute(): bool
    {
        return $this->completed_at !== null;
    }

    public function deposit(float $amount): self
    {
        $this->current_amount = (float) $this->current_amount + $amount;

        if ((float) $this->current_amount >= (float) $this->target_amount) {
            $this->current_amount = (float) $this->target_amount;
            $this->completed_at = $this->completed_at ?? now();
        }

        $this->save();

        return $this;
    }

    public function withdraw(float $amount): self
    {
        $this->current_amount = max((float) $this->current_amount - $amount, 0);

        if ((float) $this->current_amount < (float) $this->target_amount) {
            $this->completed_at = null;
        }

        $this->save();

        return $this;
    }
}

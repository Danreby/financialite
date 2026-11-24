<?php

namespace App\Models;

use App\Support\Money;
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
        $targetCents = $this->targetCents();
        if ($targetCents <= 0) {
            return 0;
        }

        // Proporção para exibição (percentual), não valor monetário.
        $progress = ($this->currentCents() / $targetCents) * 100;

        return min(round($progress, 1), 100);
    }

    public function getRemainingAttribute(): float
    {
        return max($this->targetCents() - $this->currentCents(), 0) / 100;
    }

    public function getIsCompletedAttribute(): bool
    {
        return $this->completed_at !== null;
    }

    public function deposit(string|int|float $amount): self
    {
        $targetCents = $this->targetCents();
        $newCents = $this->currentCents() + Money::fromDecimal($amount);

        if ($newCents >= $targetCents) {
            $newCents = $targetCents;
            $this->completed_at = $this->completed_at ?? now();
        }

        $this->current_amount = Money::toDecimal($newCents);
        $this->save();

        return $this;
    }

    public function withdraw(string|int|float $amount): self
    {
        $newCents = max($this->currentCents() - Money::fromDecimal($amount), 0);

        if ($newCents < $this->targetCents()) {
            $this->completed_at = null;
        }

        $this->current_amount = Money::toDecimal($newCents);
        $this->save();

        return $this;
    }

    private function targetCents(): int
    {
        return Money::fromDecimal((string) ($this->target_amount ?? '0'));
    }

    private function currentCents(): int
    {
        return Money::fromDecimal((string) ($this->current_amount ?? '0'));
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Bill extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'amount',
        'recurrence_type',
        'due_day',
        'start_date',
        'end_date',
        'color',
        'icon',
        'status',
        'category_id',
        'user_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_day' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relationships
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(BillPayment::class);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeRecurrent(Builder $query): Builder
    {
        return $query->whereIn('recurrence_type', ['monthly', 'yearly']);
    }

    public function scopeOneTime(Builder $query): Builder
    {
        return $query->where('recurrence_type', 'none');
    }

    public function getNextDueDate(): ?\Carbon\Carbon
    {
        $now = \Carbon\Carbon::now();
        
        if ($this->status !== 'active') {
            return null;
        }

        if ($now->lt($this->start_date)) {
            return $this->start_date;
        }

        if ($this->end_date && $now->gt($this->end_date)) {
            return null;
        }

        switch ($this->recurrence_type) {
            case 'monthly':
                return $this->getNextMonthlyDueDate($now);
            case 'yearly':
                return $this->getNextYearlyDueDate($now);
            case 'none':
                return $this->start_date->gte($now) ? $this->start_date : null;
            default:
                return null;
        }
    }

    private function getNextMonthlyDueDate(\Carbon\Carbon $now): \Carbon\Carbon
    {
        $dueDate = $now->copy()->day(min($this->due_day, $now->daysInMonth));
        
        if ($dueDate->lte($now)) {
            $dueDate->addMonth()->day(min($this->due_day, $dueDate->daysInMonth));
        }

        if ($this->end_date && $dueDate->gt($this->end_date)) {
            return $this->end_date;
        }

        return $dueDate;
    }

    private function getNextYearlyDueDate(\Carbon\Carbon $now): \Carbon\Carbon
    {
        $startMonth = $this->start_date->month;
        $dueDate = $now->copy()->month($startMonth)->day(min($this->due_day, $now->daysInMonth));
        
        if ($dueDate->lte($now)) {
            $dueDate->addYear()->month($startMonth)->day(min($this->due_day, $dueDate->daysInMonth));
        }

        if ($this->end_date && $dueDate->gt($this->end_date)) {
            return $this->end_date;
        }

        return $dueDate;
    }
}

<?php

namespace App\Models;

use App\Enums\BillStatus;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

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
        'status' => BillStatus::class,
        'deleted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return HasMany<BillPayment, $this> */
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
        return $query->where('status', BillStatus::Active);
    }

    public function scopeRecurrent(Builder $query): Builder
    {
        return $query->whereIn('recurrence_type', ['monthly', 'yearly']);
    }

    public function scopeOneTime(Builder $query): Builder
    {
        return $query->where('recurrence_type', 'none');
    }

    public function getNextDueDate(): ?Carbon
    {
        $now = Carbon::now();

        if ($this->status !== BillStatus::Active) {
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

    private function getNextMonthlyDueDate(Carbon $now): Carbon
    {
        $today = $now->copy()->startOfDay();
        $dueDate = $today->copy()->day(min($this->due_day, $today->daysInMonth));

        if ($dueDate->lt($today)) {
            $dueDate->addMonthNoOverflow()->day(min($this->due_day, $dueDate->daysInMonth));
        }

        if ($this->end_date && $dueDate->gt($this->end_date)) {
            return $this->end_date;
        }

        return $dueDate;
    }

    private function getNextYearlyDueDate(Carbon $now): Carbon
    {
        $today = $now->copy()->startOfDay();
        $startMonth = $this->start_date->month;
        $monthDays = $today->copy()->month($startMonth)->daysInMonth;
        $dueDate = $today->copy()->month($startMonth)->day(min($this->due_day, $monthDays));

        if ($dueDate->lt($today)) {
            $dueDate->addYear();
            $monthDays = $dueDate->copy()->month($startMonth)->daysInMonth;
            $dueDate->month($startMonth)->day(min($this->due_day, $monthDays));
        }

        if ($this->end_date && $dueDate->gt($this->end_date)) {
            return $this->end_date;
        }

        return $dueDate;
    }

    public function getDueDateForMonth(Carbon $month): ?Carbon
    {
        if ($this->status !== BillStatus::Active) {
            return null;
        }

        if ($this->recurrence_type === 'none') {
            if ($this->start_date && $this->start_date->format('Y-m') === $month->format('Y-m')) {
                return $this->start_date;
            }

            return null;
        }

        if ($this->recurrence_type === 'yearly') {
            $startMonth = $this->start_date ? $this->start_date->month : 1;
            if ($month->month !== $startMonth) {
                return null;
            }
        }

        $dueDate = $month->copy()->startOfMonth()->day(min($this->due_day, $month->daysInMonth));

        if ($this->start_date && $dueDate->lt($this->start_date)) {
            return null;
        }

        if ($this->end_date && $dueDate->gt($this->end_date)) {
            return null;
        }

        return $dueDate;
    }
}

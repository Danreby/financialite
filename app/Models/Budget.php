<?php

namespace App\Models;

use App\Enums\TransacaoType;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Budget extends Model
{
    use HasFactory;

    protected $fillable = [
        'monthly_limit',
        'month_year',
        'is_active',
        'user_id',
    ];

    protected $casts = [
        'monthly_limit' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<BudgetCategory, $this> */
    public function categoryLimits(): HasMany
    {
        return $this->hasMany(BudgetCategory::class);
    }

    /**
     * Mesma relação de categoryLimits, com o nome que a API v1 sempre usou
     * (chave budget_categories no JSON do app Android).
     *
     * @return HasMany<BudgetCategory, $this>
     */
    public function budgetCategories(): HasMany
    {
        return $this->hasMany(BudgetCategory::class);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeForMonth(Builder $query, string $monthYear): Builder
    {
        return $query->where('month_year', $monthYear);
    }

    public function scopeCurrent(Builder $query): Builder
    {
        $currentMonth = now()->format('Y-m');

        return $query->where('month_year', $currentMonth);
    }

    public function getCurrentSpending(): float
    {
        $startDate = Carbon::parse($this->month_year.'-01')->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        return Transacao::forUser($this->user_id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('type', TransacaoType::Debit)
            ->sum('amount');
    }

    public function getCategorySpending(): array
    {
        $startDate = Carbon::parse($this->month_year.'-01')->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $spending = Transacao::forUser($this->user_id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('type', TransacaoType::Debit)
            ->whereNotNull('category_id')
            ->selectRaw('category_id, SUM(amount) as total')
            ->groupBy('category_id')
            ->get()
            ->keyBy('category_id');

        return $spending->toArray();
    }
}

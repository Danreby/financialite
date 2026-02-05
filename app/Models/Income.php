<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Income extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'incomes';

    public const VALID_TYPES = ['salary', 'freelance', 'investment', 'rental', 'benefit', 'other'];

    public const VALID_PAYMENT_DAY_TYPES = ['fixed', 'business_day'];

    public const TYPE_LABELS = [
        'salary'     => 'Salário',
        'freelance'  => 'Freelance',
        'investment' => 'Investimento',
        'rental'     => 'Aluguel',
        'benefit'    => 'Benefício',
        'other'      => 'Outro',
    ];

    protected $fillable = [
        'title',
        'description',
        'amount',
        'type',
        'payment_day_type',
        'payment_day_value',
        'is_active',
        'bank_user_id',
    ];

    protected $hidden = [
        'deleted_at',
    ];

    protected $casts = [
        'amount'            => 'decimal:2',
        'payment_day_value' => 'integer',
        'is_active'         => 'boolean',
        'user_id'           => 'integer',
        'bank_user_id'      => 'integer',
        'created_at'        => 'datetime',
        'updated_at'        => 'datetime',
        'deleted_at'        => 'datetime',
    ];

    // ── Relationships ──────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bankUser(): BelongsTo
    {
        return $this->belongsTo(BankUser::class, 'bank_user_id');
    }

    // ── Scopes ─────────────────────────────────────────────

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType(Builder $query, string $type): Builder
    {
        if (in_array($type, self::VALID_TYPES, true)) {
            return $query->where('type', $type);
        }

        return $query;
    }

    public function scopeForBankUser(Builder $query, ?int $bankUserId): Builder
    {
        if ($bankUserId) {
            $query->where('bank_user_id', $bankUserId);
        }

        return $query;
    }

    // ── Helpers ────────────────────────────────────────────

    public function belongsToUser(int $userId): bool
    {
        return $this->user_id === $userId;
    }

    public function getTypeLabelAttribute(): string
    {
        return self::TYPE_LABELS[$this->type] ?? 'Outro';
    }

    public function getPaymentDayLabelAttribute(): string
    {
        if ($this->payment_day_type === 'business_day') {
            return "{$this->payment_day_value}º dia útil";
        }

        return "Dia {$this->payment_day_value}";
    }

    public static function isValidType(string $type): bool
    {
        return in_array($type, self::VALID_TYPES, true);
    }
}

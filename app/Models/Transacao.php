<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Fatura;

class Transacao extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'transacoes';

    protected $fillable = [
        'title',
        'description',
        'amount',
        'type',
        'status',
        'paid_date',
        'total_installments',
        'current_installment',
        'is_recurring',
        'user_id',
        'bank_user_id',
        'category_id',
    ];

    protected $hidden = [
        'deleted_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_date' => 'datetime',
        'is_recurring' => 'boolean',
        'total_installments' => 'integer',
        'current_installment' => 'integer',
        'user_id' => 'integer',
        'bank_user_id' => 'integer',
        'category_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public const VALID_TYPES = ['credit', 'debit'];

    public const VALID_STATUSES = ['paid', 'unpaid', 'overdue'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bankUser(): BelongsTo
    {
        return $this->belongsTo(CardUser::class, 'bank_user_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function faturas(): BelongsToMany
    {
        return $this->belongsToMany(Fatura::class, 'fatura_transacao', 'transacao_id', 'fatura_id')->withTimestamps();
    }

    public function anexos(): BelongsToMany
    {
        return $this->belongsToMany(Anexo::class, 'anexo_transacao')
            ->withTimestamps();
    }

    public function parcelas(): HasMany
    {
        return $this->hasMany(TransacaoParcela::class, 'transacao_id')
            ->orderBy('installment_number');
    }

    public function getInstallmentAmount(?int $installmentNumber = null): float
    {
        if ($this->total_installments <= 1) {
            return (float) $this->amount;
        }

        if ($installmentNumber !== null && $this->relationLoaded('parcelas')) {
            $parcela = $this->parcelas->firstWhere('installment_number', $installmentNumber);
            if ($parcela) {
                return (float) $parcela->amount;
            }
        }

        if ($this->relationLoaded('parcelas') && $this->parcelas->isNotEmpty()) {
            return (float) $this->parcelas->first()->amount;
        }

        return (float) $this->amount / max((int) $this->total_installments, 1);
    }

    public function getBankAttribute()
    {
        return $this->bankUser?->card;
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeFilter(Builder $query, array $filters = []): Builder
    {
        return $query
            ->when($filters['type'] ?? null, function (Builder $q, $type) {
                if (in_array($type, self::VALID_TYPES, true)) {
                    $q->where('type', $type);
                }
            })
            ->when($filters['status'] ?? null, function (Builder $q, $status) {
                if (in_array($status, self::VALID_STATUSES, true)) {
                    $q->where('status', $status);
                }
            })
            ->when($filters['bank_user_id'] ?? null, function (Builder $q, $bankUserId) {
                $q->where('bank_user_id', (int) $bankUserId);
            })
            ->when($filters['amount_min'] ?? null, function (Builder $q, $min) {
                $q->where('amount', '>=', (float) $min);
            })
            ->when($filters['amount_max'] ?? null, function (Builder $q, $max) {
                $q->where('amount', '<=', (float) $max);
            })
            ->when($filters['category_id'] ?? null, function (Builder $q, $categoryId) {
                $q->where('category_id', (int) $categoryId);
            })
            ->when(isset($filters['is_recurring']) && $filters['is_recurring'] !== null, function (Builder $q) use ($filters) {
                $value = filter_var($filters['is_recurring'], FILTER_VALIDATE_BOOLEAN);
                $q->where('is_recurring', $value);
            })
            ->when($filters['month'] ?? null, function (Builder $q, $month) {
                try {
                    $date = Carbon::createFromFormat('Y-m-d', $month . '-01');
                    $q->whereYear('created_at', $date->year)
                      ->whereMonth('created_at', $date->month);
                } catch (\Throwable $e) {}
            });
    }

    public function scopeBetweenDueDates(Builder $query, $start, $end): Builder
    {
        $startDate = $start instanceof Carbon ? $start->toDateString() : $start;
        $endDate = $end instanceof Carbon ? $end->toDateString() : $end;
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function scopeNotStatus(Builder $query, string $status): Builder
    {
        if (in_array($status, self::VALID_STATUSES, true)) {
            return $query->where('status', '!=', $status);
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

    public function belongsToUser(int $userId): bool
    {
        return $this->user_id === $userId;
    }

    public static function isValidType(string $type): bool
    {
        return in_array($type, self::VALID_TYPES, true);
    }

    public static function isValidStatus(string $status): bool
    {
        return in_array($status, self::VALID_STATUSES, true);
    }
}

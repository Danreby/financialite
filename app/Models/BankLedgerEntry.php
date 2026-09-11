<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class BankLedgerEntry extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'bank_ledger_entries';

    public const TYPE_ACCOUNT_OPENING = 'account_opening';

    public const TYPE_MANUAL_ADJUSTMENT = 'manual_adjustment';

    public const TYPE_INCOME_CREDIT = 'income_credit';

    public const TYPE_INVOICE_PAYMENT = 'invoice_payment';

    public const TYPE_DEBIT_PURCHASE = 'debit_purchase';

    public const TYPE_TRANSFER_OUT = 'transfer_out';

    public const TYPE_TRANSFER_IN = 'transfer_in';

    public const TYPES = [
        self::TYPE_ACCOUNT_OPENING,
        self::TYPE_MANUAL_ADJUSTMENT,
        self::TYPE_INCOME_CREDIT,
        self::TYPE_INVOICE_PAYMENT,
        self::TYPE_DEBIT_PURCHASE,
        self::TYPE_TRANSFER_OUT,
        self::TYPE_TRANSFER_IN,
    ];

    public const TYPE_LABELS = [
        self::TYPE_ACCOUNT_OPENING => 'Saldo inicial',
        self::TYPE_MANUAL_ADJUSTMENT => 'Ajuste manual',
        self::TYPE_INCOME_CREDIT => 'Receita',
        self::TYPE_INVOICE_PAYMENT => 'Pagamento de fatura',
        self::TYPE_DEBIT_PURCHASE => 'Compra no débito',
        self::TYPE_TRANSFER_OUT => 'Transferência enviada',
        self::TYPE_TRANSFER_IN => 'Transferência recebida',
    ];

    protected $fillable = [
        'user_id',
        'bank_user_id',
        'type',
        'amount',
        'balance_after',
        'source_type',
        'source_id',
        'description',
        'created_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'user_id' => 'integer',
        'bank_user_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function bankUser(): BelongsTo
    {
        return $this->belongsTo(BankUser::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeForBankUser(Builder $query, int $bankUserId): Builder
    {
        return $query->where('bank_user_id', $bankUserId);
    }

    public function scopeRecent(Builder $query): Builder
    {
        return $query->orderByDesc('created_at')->orderByDesc('id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FaturaPaymentEvent extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'fatura_payment_events';

    public const TYPE_PAYMENT = 'payment';

    public const TYPE_REVERSAL = 'reversal';

    public const TYPES = [
        self::TYPE_PAYMENT,
        self::TYPE_REVERSAL,
    ];

    protected $fillable = [
        'fatura_id',
        'transacao_id',
        'bank_ledger_entry_id',
        'type',
        'amount',
        'description',
        'created_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fatura_id' => 'integer',
        'transacao_id' => 'integer',
        'bank_ledger_entry_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function fatura(): BelongsTo
    {
        return $this->belongsTo(Fatura::class);
    }

    public function transacao(): BelongsTo
    {
        return $this->belongsTo(Transacao::class);
    }

    public function bankLedgerEntry(): BelongsTo
    {
        return $this->belongsTo(BankLedgerEntry::class);
    }

    public function scopeForFatura(Builder $query, int $faturaId): Builder
    {
        return $query->where('fatura_id', $faturaId);
    }
}

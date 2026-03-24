<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransacaoParcela extends Model
{
    use HasFactory;

    protected $table = 'transacao_parcelas';

    protected $fillable = [
        'transacao_id',
        'installment_number',
        'amount',
        'due_date',
        'status',
        'paid_date',
    ];

    protected $casts = [
        'transacao_id' => 'integer',
        'installment_number' => 'integer',
        'amount' => 'decimal:2',
        'due_date' => 'date',
        'paid_date' => 'date',
    ];

    public const VALID_STATUSES = ['pending', 'paid', 'overdue'];

    public function transacao(): BelongsTo
    {
        return $this->belongsTo(Transacao::class, 'transacao_id');
    }
}

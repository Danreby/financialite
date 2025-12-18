<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Faturas extends Model
{
    protected $table = 'faturas';

    protected $fillable = [
        'title',
        'description',
        'amount',
        'due_date',
        'type',
        'status',
        'paid_date',
        'total_installments',
        'current_installment',
        'is_recurring',
        'user_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

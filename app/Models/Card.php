<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class Card extends Model
{
    use SoftDeletes;

    protected $table = 'cards';

    public const VALID_BRANDS = ['visa', 'mastercard', 'elo', 'hipercard', 'american_express', 'diners_club'];

    public const BRAND_LABELS = [
        'visa' => 'Visa',
        'mastercard' => 'Mastercard',
        'elo' => 'Elo',
        'hipercard' => 'Hipercard',
        'american_express' => 'American Express',
        'diners_club' => 'Diners Club',
    ];

    protected $fillable = [
        'name',
        'brand',
        'description',
    ];

    protected $hidden = [
        'deleted_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->whereHas('cardUsers', function (Builder $sub) use ($userId) {
            $sub->where('user_id', $userId);
        });
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('name');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'card_user', 'card_id', 'user_id')->withTimestamps();
    }

    public function cardUsers(): HasMany
    {
        return $this->hasMany(CardUser::class, 'card_id');
    }

    public function faturas(): HasManyThrough
    {
        return $this->hasManyThrough(Fatura::class, CardUser::class, 'card_id', 'bank_user_id');
    }

    public function belongsToUser(int $userId): bool
    {
        return $this->users()->where('users.id', $userId)->exists();
    }
}

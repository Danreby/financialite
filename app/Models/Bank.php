<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Bank extends Model
{
    use SoftDeletes;

    protected $table = 'banks';

    protected $fillable = [
        'name',
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
        return $query->whereHas('bankUsers', function (Builder $sub) use ($userId) {
            $sub->where('user_id', $userId);
        });
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('name');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'bank_user', 'bank_id', 'user_id')->withTimestamps();
    }

    public function bankUsers(): HasMany
    {
        return $this->hasMany(CardUser::class, 'bank_id');
    }

    public function faturas(): HasManyThrough
    {
        return $this->hasManyThrough(Fatura::class, CardUser::class, 'bank_id', 'bank_user_id');
    }

    public function belongsToUser(int $userId): bool
    {
        return $this->users()->where('users.id', $userId)->exists();
    }
}


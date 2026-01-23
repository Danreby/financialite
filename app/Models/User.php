<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'email_verified_at',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function banks(): BelongsToMany
    {
        return $this->belongsToMany(Bank::class, 'bank_user', 'user_id', 'bank_id');
    }

    public function faturas(): HasMany
    {
        return $this->hasMany(Fatura::class);
    }

    public function transacoes(): HasMany
    {
        return $this->hasMany(Transacao::class);
    }

    public function bankUsers(): HasMany
    {
        return $this->hasMany(BankUser::class, 'user_id');
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function userNotifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function getAvailableBanksAttribute()
    {
        return $this->banks()->get();
    }

    public function owns($resource): bool
    {
        if (!property_exists($resource, 'user_id') && !isset($resource->user_id)) {
            return false;
        }

        return $resource->user_id === $this->id;
    }
}

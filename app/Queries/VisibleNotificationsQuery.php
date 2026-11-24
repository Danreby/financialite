<?php

namespace App\Queries;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Notificações visíveis do usuário (sem as linhas internas `__meta:`), da mais
 * nova para a mais antiga. Web usa `get()`, a API usa `paginate()`.
 */
class VisibleNotificationsQuery
{
    /** @return Builder<Notification> */
    public function handle(User $user): Builder
    {
        return Notification::forUser($user->id)
            ->visible()
            ->orderByDesc('created_at');
    }
}

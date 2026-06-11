<?php

namespace App\Policies;

use App\Models\Transacao;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class TransacaoPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Transacao $transacao): bool
    {
        return $this->isOwner($user, $transacao);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, ?Transacao $transacao = null): bool
    {
        if ($transacao === null) {
            return true;
        }

        return $this->isOwner($user, $transacao);
    }

    public function delete(User $user, Transacao $transacao): bool
    {
        return $this->isOwner($user, $transacao);
    }

    public function restore(User $user, Transacao $transacao): bool
    {
        return $this->isOwner($user, $transacao);
    }

    public function forceDelete(User $user, Transacao $transacao): bool
    {
        return $this->isOwner($user, $transacao);
    }

    protected function isOwner(User $user, Transacao $transacao): bool
    {
        return $transacao->user_id === $user->id;
    }
}

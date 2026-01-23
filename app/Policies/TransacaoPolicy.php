<?php

namespace App\Policies;

use App\Models\Transacao;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

/**
 * Policy for Transacao (Fatura) authorization.
 */
class TransacaoPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any transacoes.
     *
     * @param User $user
     * @return bool
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the transacao.
     *
     * @param User $user
     * @param Transacao $transacao
     * @return bool
     */
    public function view(User $user, Transacao $transacao): bool
    {
        return $this->isOwner($user, $transacao);
    }

    /**
     * Determine whether the user can create transacoes.
     *
     * @param User $user
     * @return bool
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the transacao.
     *
     * @param User $user
     * @param Transacao $transacao
     * @return bool
     */
    public function update(User $user, Transacao $transacao): bool
    {
        return $this->isOwner($user, $transacao);
    }

    /**
     * Determine whether the user can delete the transacao.
     *
     * @param User $user
     * @param Transacao $transacao
     * @return bool
     */
    public function delete(User $user, Transacao $transacao): bool
    {
        return $this->isOwner($user, $transacao);
    }

    /**
     * Determine whether the user can restore the transacao.
     *
     * @param User $user
     * @param Transacao $transacao
     * @return bool
     */
    public function restore(User $user, Transacao $transacao): bool
    {
        return $this->isOwner($user, $transacao);
    }

    /**
     * Determine whether the user can permanently delete the transacao.
     *
     * @param User $user
     * @param Transacao $transacao
     * @return bool
     */
    public function forceDelete(User $user, Transacao $transacao): bool
    {
        return $this->isOwner($user, $transacao);
    }

    /**
     * Check if the user is the owner of the transacao.
     *
     * @param User $user
     * @param Transacao $transacao
     * @return bool
     */
    protected function isOwner(User $user, Transacao $transacao): bool
    {
        return $transacao->user_id === $user->id;
    }
}

<?php

namespace App\Policies;

use App\Models\Anexo;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class AnexoPolicy
{
    use HandlesAuthorization;

    /**
     * Determina se o usuário pode visualizar qualquer anexo.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determina se o usuário pode visualizar o anexo.
     */
    public function view(User $user, Anexo $anexo): bool
    {
        return $this->isOwner($user, $anexo);
    }

    /**
     * Determina se o usuário pode criar anexos.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determina se o usuário pode atualizar o anexo.
     */
    public function update(User $user, ?Anexo $anexo = null): bool
    {
        if ($anexo === null) {
            return true;
        }
        return $this->isOwner($user, $anexo);
    }

    /**
     * Determina se o usuário pode deletar o anexo.
     */
    public function delete(User $user, Anexo $anexo): bool
    {
        return $this->isOwner($user, $anexo);
    }

    /**
     * Determina se o usuário pode restaurar o anexo.
     */
    public function restore(User $user, Anexo $anexo): bool
    {
        return $this->isOwner($user, $anexo);
    }

    /**
     * Determina se o usuário pode deletar permanentemente o anexo.
     */
    public function forceDelete(User $user, Anexo $anexo): bool
    {
        return $this->isOwner($user, $anexo);
    }

    /**
     * Determina se o usuário pode fazer download do anexo.
     */
    public function download(User $user, Anexo $anexo): bool
    {
        return $this->isOwner($user, $anexo);
    }

    /**
     * Determina se o usuário pode anexar a transações.
     */
    public function attach(User $user, Anexo $anexo): bool
    {
        return $this->isOwner($user, $anexo);
    }

    /**
     * Determina se o usuário pode desanexar de transações.
     */
    public function detach(User $user, Anexo $anexo): bool
    {
        return $this->isOwner($user, $anexo);
    }

    /**
     * Verifica se o usuário é dono do anexo.
     */
    protected function isOwner(User $user, Anexo $anexo): bool
    {
        return $anexo->user_id === $user->id;
    }
}

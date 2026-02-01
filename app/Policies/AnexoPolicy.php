<?php

namespace App\Policies;

use App\Models\Anexo;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class AnexoPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Anexo $anexo): bool
    {
        return $this->isOwner($user, $anexo);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, ?Anexo $anexo = null): bool
    {
        if ($anexo === null) {
            return true;
        }
        return $this->isOwner($user, $anexo);
    }

    public function delete(User $user, Anexo $anexo): bool
    {
        return $this->isOwner($user, $anexo);
    }

    public function restore(User $user, Anexo $anexo): bool
    {
        return $this->isOwner($user, $anexo);
    }

    public function forceDelete(User $user, Anexo $anexo): bool
    {
        return $this->isOwner($user, $anexo);
    }

    public function download(User $user, Anexo $anexo): bool
    {
        return $this->isOwner($user, $anexo);
    }

    public function attach(User $user, Anexo $anexo): bool
    {
        return $this->isOwner($user, $anexo);
    }

    public function detach(User $user, Anexo $anexo): bool
    {
        return $this->isOwner($user, $anexo);
    }

    protected function isOwner(User $user, Anexo $anexo): bool
    {
        return $anexo->user_id === $user->id;
    }
}

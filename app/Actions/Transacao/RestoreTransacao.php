<?php

namespace App\Actions\Transacao;

use App\Models\Transacao;
use App\Models\User;
use DomainException;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Restaura uma transação removida do usuário.
 *
 * Usada por TransacaoController::restore (web) e TransacaoApiController::restore.
 */
class RestoreTransacao
{
    /**
     * @throws ModelNotFoundException transação de outro usuário
     * @throws DomainException a transação não está removida
     */
    public function handle(User $user, int $id): Transacao
    {
        $transacao = Transacao::withTrashed()->forUser($user->id)->findOrFail($id);

        if (! $transacao->trashed()) {
            throw new DomainException('Transação não está removida.');
        }

        $transacao->restore();

        return $transacao;
    }
}

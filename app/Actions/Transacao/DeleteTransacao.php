<?php

namespace App\Actions\Transacao;

use App\Models\Transacao;
use App\Models\User;
use App\Services\FaturaService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Remove (soft delete) uma transação do usuário.
 *
 * Usada por TransacaoController::destroy (web) e TransacaoApiController::destroy.
 */
class DeleteTransacao
{
    public function __construct(private FaturaService $faturas) {}

    /**
     * @throws ModelNotFoundException transação de outro usuário
     */
    public function handle(User $user, int $id): void
    {
        $this->faturas->deleteForUser(Transacao::forUser($user->id)->findOrFail($id));
    }
}

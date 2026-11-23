<?php

namespace App\Actions\Transacao;

use App\Models\CardUser;
use App\Models\Transacao;
use App\Models\User;
use App\Services\FaturaService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Lança uma transação (compra no cartão ou débito em conta).
 *
 * Usada por TransacaoController::store (web) e TransacaoApiController::store.
 */
class CreateTransacao
{
    public function __construct(private FaturaService $faturas) {}

    /**
     * @param  array<string, mixed>  $data  saída de FaturaStoreRequest::validated()
     *
     * @throws ModelNotFoundException cartão de outro usuário
     */
    public function handle(User $user, array $data): Transacao
    {
        if (! empty($data['bank_user_id'])) {
            CardUser::forUser($user->id)->findOrFail($data['bank_user_id']);
        }

        return $this->faturas->createForUser($user, $data);
    }
}

<?php

namespace App\Actions\Transacao;

use App\Models\CardUser;
use App\Models\Transacao;
use App\Models\User;
use App\Services\FaturaService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Edita uma transação do usuário (refaz parcelas e estorna pagamento quando preciso).
 *
 * Usada por TransacaoController::update (web) e TransacaoApiController::update.
 */
class UpdateTransacao
{
    public function __construct(private FaturaService $faturas) {}

    /**
     * @param  array<string, mixed>  $data  saída de FaturaUpdateRequest::validated()
     *
     * @throws ModelNotFoundException transação ou cartão de outro usuário
     */
    public function handle(User $user, int $id, array $data): Transacao
    {
        $transacao = Transacao::forUser($user->id)->findOrFail($id);

        if (! empty($data['bank_user_id'])) {
            CardUser::forUser($user->id)->findOrFail($data['bank_user_id']);
        }

        return $this->faturas->updateForUser($transacao, $data);
    }
}

<?php

namespace App\Actions\Card;

use App\Models\CardUser;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Desfaz o vínculo do usuário com um cartão, sem apagar o cartão. Usada por
 * CardApiController::destroy (api/v1/cards/{id}) e CardUserApiController::destroy.
 * Para apagar também o cartão próprio, use DeleteCard.
 */
class DetachCardUser
{
    /**
     * @throws ModelNotFoundException vínculo de outro usuário
     */
    public function handle(User $user, int $id): void
    {
        CardUser::forUser($user->id)->findOrFail($id)->delete();
    }
}

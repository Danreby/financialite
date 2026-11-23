<?php

namespace App\Actions\Card;

use App\Models\CardUser;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

/**
 * Edita o vínculo do usuário com um cartão: vencimento, fechamento e limite (só as
 * chaves enviadas). Bandeira e descrição só mudam quando o cartão é do próprio
 * usuário; cartão do catálogo nunca é editado.
 *
 * Usada por CardController::updateDueDay (web, cards.update-due-day),
 * CardApiController::update (api/v1/cards/{id}) e CardUserApiController::update
 * (api/v1/card-users/{id}).
 */
class UpdateCardUser
{
    /**
     * @param  array<string, mixed>  $data
     *
     * @throws ModelNotFoundException vínculo de outro usuário
     */
    public function handle(User $user, int $id, array $data): CardUser
    {
        return DB::transaction(function () use ($user, $id, $data) {
            $cardUser = CardUser::forUser($user->id)->lockForUpdate()->findOrFail($id);

            foreach (['due_day', 'closing_day', 'credit_limit'] as $field) {
                if (array_key_exists($field, $data)) {
                    $cardUser->{$field} = $data[$field];
                }
            }
            $cardUser->save();

            $card = $cardUser->card;
            $details = array_intersect_key($data, array_flip(['brand', 'description']));
            if ($card && $card->user_id === $user->id && $details !== []) {
                $card->update($details);
            }

            return $cardUser->load('card');
        });
    }
}

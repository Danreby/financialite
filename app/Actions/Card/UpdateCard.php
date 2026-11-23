<?php

namespace App\Actions\Card;

use App\Models\Card;
use App\Models\CardUser;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

/**
 * Edita um cartão próprio do usuário (nome, bandeira, descrição) e, se enviados,
 * vencimento, fechamento e limite do vínculo. Cartão do catálogo ou de outro usuário
 * responde 404. Usada por CardResourceApiController::update (api/v1/card-resources).
 */
class UpdateCard
{
    /**
     * @param  array<string, mixed>  $data  saída de CardUpdateRequest::validated()
     *
     * @throws ModelNotFoundException
     */
    public function handle(User $user, int $id, array $data): Card
    {
        return DB::transaction(function () use ($user, $id, $data) {
            $card = Card::forUser($user->id)->where('user_id', $user->id)->lockForUpdate()->findOrFail($id);

            $card->update([
                'name' => $data['name'],
                'brand' => $data['brand'] ?? $card->brand,
                'description' => $data['description'] ?? $card->description,
            ]);

            $linkFields = array_filter(
                array_intersect_key($data, array_flip(['due_day', 'closing_day', 'credit_limit'])),
                fn ($value) => $value !== null,
            );

            if ($linkFields !== []) {
                CardUser::forUser($user->id)->forCard($card->id)->first()?->update($linkFields);
            }

            return $card;
        });
    }
}

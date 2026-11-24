<?php

namespace App\Actions\Card;

use App\Models\Card;
use App\Models\CardUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Cadastra um cartão próprio do usuário e já o vincula a ele (card_user com
 * vencimento, fechamento e limite). Usada por CardResourceApiController::store
 * (api/v1/card-resources); a web cadastra pelo vínculo (AttachCard).
 */
class CreateCard
{
    /**
     * @param  array<string, mixed>  $data  saída de CardStoreRequest::validated()
     */
    public function handle(User $user, array $data): Card
    {
        return DB::transaction(function () use ($user, $data) {
            $card = Card::create([
                'name' => $data['name'],
                'brand' => $data['brand'] ?? null,
                'description' => $data['description'] ?? null,
            ]);
            $card->forceFill(['user_id' => $user->id])->save();

            CardUser::create([
                'card_id' => $card->id,
                'user_id' => $user->id,
                'due_day' => $data['due_day'] ?? null,
                'closing_day' => $data['closing_day'] ?? null,
                'credit_limit' => $data['credit_limit'] ?? null,
            ]);

            return $card;
        });
    }
}

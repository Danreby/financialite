<?php

namespace App\Actions\Card;

use App\Exceptions\CardAlreadyAttachedException;
use App\Models\CardUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Vincula um cartão (do catálogo ou próprio) ao usuário, com vencimento, fechamento
 * e limite. Usada por CardController::attachToUser (web), CardApiController::store
 * (api/v1/cards) e CardUserApiController::store (api/v1/card-users).
 */
class AttachCard
{
    /**
     * @param  array<string, mixed>  $data  card_id já validado como visível ao usuário
     *
     * @throws CardAlreadyAttachedException
     */
    public function handle(User $user, array $data): CardUser
    {
        return DB::transaction(function () use ($user, $data) {
            $existing = CardUser::forUser($user->id)
                ->forCard($data['card_id'])
                ->lockForUpdate()
                ->first();

            if ($existing) {
                throw new CardAlreadyAttachedException($existing);
            }

            return CardUser::create([
                'user_id' => $user->id,
                'card_id' => $data['card_id'],
                'due_day' => $data['due_day'] ?? null,
                'closing_day' => $data['closing_day'] ?? null,
                'credit_limit' => $data['credit_limit'] ?? null,
            ]);
        });
    }
}

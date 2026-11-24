<?php

namespace App\Actions\Card;

use App\Models\Card;
use App\Models\CardUser;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Support\Facades\DB;

/**
 * Desvincula um cartão do usuário e, se o cartão for dele (não do catálogo),
 * apaga o cartão também.
 *
 * Usada por CardController::destroy (web, rota cards.destroy) e
 * Api\V1\CardResourceApiController::destroy (api/v1/card-resources).
 */
class DeleteCard
{
    public function __construct(private NotificationService $notifications) {}

    /**
     * Quem chama resolve o cartão pelo vínculo do usuário ($user->cards()),
     * o que já devolve 404 para cartão de outro usuário.
     */
    public function handle(User $user, Card $card): void
    {
        DB::transaction(function () use ($user, $card) {
            CardUser::forUser($user->id)
                ->forCard($card->id)
                ->delete();

            if ($card->user_id === $user->id) {
                $card->delete();
            }

            $this->notifications->info($user, 'Cartão removido', 'Um cartão foi desvinculado da sua conta.');
        });
    }
}

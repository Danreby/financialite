<?php

namespace App\Http\Controllers;

use App\Actions\Card\AttachCard;
use App\Actions\Card\DeleteCard;
use App\Actions\Card\UpdateCardUser;
use App\Exceptions\CardAlreadyAttachedException;
use App\Http\Requests\Card\AttachCardToUserRequest;
use App\Http\Requests\Card\UpdateCardDueDayRequest;
use App\Models\Card;
use App\Models\CardUser;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class CardController extends Controller
{
    public function __construct(private NotificationService $notifications)
    {
        $this->middleware('auth');
    }

    public function destroy(Request $request, int $id, DeleteCard $deleteCard): JsonResponse
    {
        $user = $request->user();

        $card = $user->cards()->findOrFail($id);

        $this->authorize('delete', $card);

        $deleteCard->handle($user, $card);

        return $this->success(['message' => 'Cartão removido.']);
    }

    public function list(Request $request): JsonResponse
    {
        $cards = Card::visibleTo($request->user()->id)->ordered()->get(['id', 'name']);

        return $this->success($cards);
    }

    public function updateDueDay(UpdateCardDueDayRequest $request, int $cardUser, UpdateCardUser $updateCardUser): JsonResponse
    {
        $user = $request->user();
        $updated = $updateCardUser->handle($user, $cardUser, $request->validated());

        $this->notifications->info($user, 'Cartão atualizado', 'As informações do cartão foram atualizadas.');

        return $this->success($this->mapCardUser($updated));
    }

    public function attachToUser(AttachCardToUserRequest $request, AttachCard $attachCard): JsonResponse
    {
        $this->authorize('create', CardUser::class);

        $user = $request->user();

        try {
            $cardUser = $attachCard->handle($user, $request->validated());
        } catch (CardAlreadyAttachedException $e) {
            $this->notifications->warning($user, 'Cartão já vinculado', 'Tentativa de vincular um cartão que já está associado à sua conta.');

            return $this->success([
                'already_attached' => true,
                'message' => $e->getMessage(),
                'card_user' => $e->cardUser->load('card'),
            ]);
        }

        $this->notifications->info($user, 'Conta vinculada', 'Um cartão foi vinculado com sucesso.');

        return $this->success($cardUser->load('card'), 201);
    }

    public function accounts(Request $request): InertiaResponse
    {
        $bankAccounts = CardUser::with('card')
            ->forUser($request->user()->id)
            ->orderBy('id')
            ->paginate(10, ['*'], 'accounts_page')
            ->through(fn (CardUser $cardUser) => $this->mapCardUser($cardUser));

        return Inertia::render('Cartoes', [
            'bankAccounts' => $bankAccounts,
        ]);
    }

    /** @return array<string, mixed> */
    private function mapCardUser(CardUser $cardUser): array
    {
        return [
            'id' => $cardUser->id,
            'card_id' => $cardUser->card_id,
            'name' => $cardUser->card->name ?? ('Cartão #'.$cardUser->id),
            'due_day' => $cardUser->due_day,
            'closing_day' => $cardUser->closing_day,
            'credit_limit' => $cardUser->credit_limit,
            'brand' => $cardUser->card?->brand,
            'description' => $cardUser->card?->description,
        ];
    }
}

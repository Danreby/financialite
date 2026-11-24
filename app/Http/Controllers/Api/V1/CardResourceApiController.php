<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Card\CreateCard;
use App\Actions\Card\DeleteCard;
use App\Actions\Card\UpdateCard;
use App\Http\Controllers\Controller;
use App\Http\Requests\Card\CardStoreRequest;
use App\Http\Requests\Card\CardUpdateRequest;
use App\Models\Card;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * api/v1/card-resources: cadastro de cartões próprios do usuário.
 *
 * Antes era servido pelo CardController web. Formato e status mantidos.
 */
class CardResourceApiController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Card::class);

        $cards = Card::forUser($request->user()->id)
            ->ordered()
            ->paginate(20);

        return $this->success($cards);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $card = Card::forUser($request->user()->id)->findOrFail($id);

        return $this->success($card);
    }

    public function store(CardStoreRequest $request, CreateCard $createCard): JsonResponse
    {
        $this->authorize('create', Card::class);

        $user = $request->user();
        $card = $createCard->handle($user, $request->validated());

        $this->notifications->info($user, 'Cartão adicionado', 'Um novo cartão foi vinculado à sua conta.');

        return $this->success($card, 201);
    }

    public function update(CardUpdateRequest $request, int $id, UpdateCard $updateCard): JsonResponse
    {
        $user = $request->user();
        $card = $updateCard->handle($user, $id, $request->validated());

        $this->notifications->info($user, 'Cartão atualizado', 'As informações do cartão foram atualizadas.');

        return $this->success($card);
    }

    public function destroy(Request $request, int $id, DeleteCard $deleteCard): JsonResponse
    {
        $user = $request->user();
        $card = $user->cards()->findOrFail($id);

        $this->authorize('delete', $card);

        $deleteCard->handle($user, $card);

        return $this->success(['message' => 'Cartão removido.']);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Card\DeleteCard;
use App\Http\Controllers\Controller;
use App\Http\Requests\Card\CardStoreRequest;
use App\Http\Requests\Card\CardUpdateRequest;
use App\Models\Card;
use App\Models\CardUser;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        $this->authorize('view', $card);

        return $this->success($card);
    }

    public function store(CardStoreRequest $request): JsonResponse
    {
        $this->authorize('create', Card::class);

        $user = $request->user();

        $data = $request->validated();
        $card = DB::transaction(function () use ($data, $user) {
            $card = Card::create([
                'name' => $data['name'],
                'brand' => $data['brand'] ?? null,
                'description' => $data['description'] ?? null,
            ]);
            $card->forceFill(['user_id' => $user->id])->save();

            CardUser::create([
                'card_id' => $card->id,
                'user_id' => $user->id,
                'closing_day' => $data['closing_day'] ?? null,
                'credit_limit' => $data['credit_limit'] ?? null,
            ]);

            $this->notifications->info($user, 'Cartão adicionado', 'Um novo cartão foi vinculado à sua conta.');

            return $card;
        });

        return $this->success($card, 201);
    }

    public function update(CardUpdateRequest $request, int $id): JsonResponse
    {
        $user = $request->user();

        $card = Card::forUser($user->id)->where('user_id', $user->id)->findOrFail($id);

        $this->authorize('update', $card);

        $data = $request->validated();
        DB::transaction(function () use ($card, $data, $user) {
            $card->update([
                'name' => $data['name'],
                'brand' => $data['brand'] ?? $card->brand,
                'description' => $data['description'] ?? $card->description,
            ]);

            if (isset($data['closing_day']) || isset($data['credit_limit'])) {
                $cardUser = CardUser::forUser($user->id)->forCard($card->id)->first();
                if ($cardUser) {
                    if (isset($data['closing_day'])) {
                        $cardUser->closing_day = $data['closing_day'];
                    }
                    if (isset($data['credit_limit'])) {
                        $cardUser->credit_limit = $data['credit_limit'];
                    }
                    $cardUser->save();
                }
            }

            $this->notifications->info($user, 'Cartão atualizado', 'As informações do cartão foram atualizadas.');
        });

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

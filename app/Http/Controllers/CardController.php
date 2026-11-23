<?php

namespace App\Http\Controllers;

use App\Actions\Card\DeleteCard;
use App\Http\Requests\Card\AttachCardToUserRequest;
use App\Http\Requests\Card\UpdateCardDueDayRequest;
use App\Models\Card;
use App\Models\CardUser;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function updateDueDay(UpdateCardDueDayRequest $request, CardUser $cardUser): JsonResponse
    {
        $this->authorize('update', $cardUser);

        $user = $request->user();
        $data = $request->validated();

        DB::transaction(function () use ($cardUser, $data, $user) {
            if (array_key_exists('due_day', $data)) {
                $cardUser->due_day = $data['due_day'];
            }
            if (array_key_exists('closing_day', $data)) {
                $cardUser->closing_day = $data['closing_day'];
            }
            if (array_key_exists('credit_limit', $data)) {
                $cardUser->credit_limit = $data['credit_limit'];
            }
            $cardUser->save();

            $card = $cardUser->card;
            if ($card && $card->user_id === $user->id) {
                $changed = false;
                if (array_key_exists('brand', $data)) {
                    $card->brand = $data['brand'];
                    $changed = true;
                }
                if (array_key_exists('description', $data)) {
                    $card->description = $data['description'];
                    $changed = true;
                }
                if ($changed) {
                    $card->save();
                }
            }

            $this->notifications->info($user, 'Cartão atualizado', 'As informações do cartão foram atualizadas.');
        });

        $cardUser->load('card');

        return $this->success([
            'id' => $cardUser->id,
            'card_id' => $cardUser->card_id,
            'name' => $cardUser->card?->name ?? ('Cartão #'.$cardUser->id),
            'due_day' => $cardUser->due_day,
            'closing_day' => $cardUser->closing_day,
            'credit_limit' => $cardUser->credit_limit,
            'brand' => $cardUser->card?->brand,
            'description' => $cardUser->card?->description,
        ]);
    }

    public function attachToUser(AttachCardToUserRequest $request): JsonResponse
    {
        $this->authorize('create', CardUser::class);

        $user = $request->user();

        $data = $request->validated();

        $exists = CardUser::forUser($user->id)
            ->forCard($data['card_id'])
            ->first();

        if ($exists) {
            $this->notifications->warning($user, 'Cartão já vinculado', 'Tentativa de vincular um cartão que já está associado à sua conta.');

            return $this->success([
                'already_attached' => true,
                'message' => 'Este cartão já está vinculado ao usuário.',
                'card_user' => $exists->load('card'),
            ]);
        }

        $cardUser = DB::transaction(function () use ($data, $user) {
            $cardUser = CardUser::create([
                'user_id' => $user->id,
                'card_id' => $data['card_id'],
                'due_day' => $data['due_day'] ?? null,
                'closing_day' => $data['closing_day'] ?? null,
                'credit_limit' => $data['credit_limit'] ?? null,
            ]);

            $this->notifications->info($user, 'Conta vinculada', 'Um cartão foi vinculado com sucesso.');

            return $cardUser;
        });

        return $this->success($cardUser->load('card'), 201);
    }

    public function accounts(Request $request): InertiaResponse
    {
        $user = $request->user();

        $bankAccounts = CardUser::with('card')
            ->forUser($user->id)
            ->orderBy('id')
            ->paginate(10, ['*'], 'accounts_page')
            ->through(function ($cardUser) {
                return [
                    'id' => $cardUser->id,
                    'card_id' => $cardUser->card_id,
                    'name' => $cardUser->card?->name ?? ('Cartão #'.$cardUser->id),
                    'due_day' => $cardUser->due_day,
                    'closing_day' => $cardUser->closing_day,
                    'credit_limit' => $cardUser->credit_limit,
                    'brand' => $cardUser->card?->brand,
                    'description' => $cardUser->card?->description,
                ];
            });

        return Inertia::render('Cartoes', [
            'bankAccounts' => $bankAccounts,
        ]);
    }
}

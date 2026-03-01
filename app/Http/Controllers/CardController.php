<?php

namespace App\Http\Controllers;

use App\Http\Requests\Card\AttachCardToUserRequest;
use App\Http\Requests\Card\CardStoreRequest;
use App\Http\Requests\Card\CardUpdateRequest;
use App\Http\Requests\Card\UpdateCardDueDayRequest;
use App\Models\Card;
use App\Models\CardUser;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class CardController extends Controller
{
    public function __construct(private NotificationService $notifications)
    {
        $this->middleware('auth');
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Card::class);

        $user = $request->user();
        
        $cards = Card::forUser($user->id)
            ->ordered()
            ->paginate(20);
            
        return $this->success($cards);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        
        $card = Card::forUser($user->id)->findOrFail($id);
        
        $this->authorize('view', $card);
        
        return $this->success($card);
    }

    public function store(CardStoreRequest $request): JsonResponse
    {
        $this->authorize('create', Card::class);

        $user = $request->user();
        
        $data = $this->normalizeInsertData($request->validated());
        $card = DB::transaction(function () use ($data, $user) {
            $card = Card::create([
                'name'        => $data['name'],
                'brand'       => $data['brand'] ?? null,
                'description' => $data['description'] ?? null,
            ]);

            CardUser::create([
                'card_id'      => $card->id,
                'user_id'      => $user->id,
                'closing_day'  => $data['closing_day'] ?? null,
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
        
        $card = Card::forUser($user->id)->findOrFail($id);

        $this->authorize('update', $card);

        $data = $request->validated();
        DB::transaction(function () use ($card, $data, $user) {
            $card->update([
                'name'        => $data['name'],
                'brand'       => $data['brand'] ?? $card->brand,
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

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        
        $card = $user->cards()->findOrFail($id);
        
        $this->authorize('delete', $card);
        
        DB::transaction(function () use ($user, $card) {
            CardUser::forUser($user->id)
                ->forCard($card->id)
                ->delete();

            $card->delete();

            $this->notifications->info($user, 'Cartão removido', 'Um cartão foi desvinculado da sua conta.');
        });

        return $this->success(['message' => 'Cartão removido.']);
    }

    public function list(Request $request): JsonResponse
    {
        $cards = Card::ordered()->get(['id', 'name']);
        return $this->success($cards);
    }

    public function updateDueDay(UpdateCardDueDayRequest $request, CardUser $cardUser): JsonResponse
    {
        $this->authorize('update', $cardUser);

        $user = $request->user();
        $data = $request->validated();

        DB::transaction(function () use ($cardUser, $data, $user) {
            $cardUser->due_day = $data['due_day'];
            $cardUser->save();

            $this->notifications->info($user, 'Vencimento atualizado', 'O dia de vencimento da fatura foi atualizado.');
        });

        return $this->success([
            'message' => 'Dia de vencimento atualizado com sucesso.',
            'card_user_id' => $cardUser->id,
            'due_day' => $data['due_day'],
        ]);
    }

    public function attachToUser(AttachCardToUserRequest $request): JsonResponse
    {
        $this->authorize('create', CardUser::class);

        $user = $request->user();

        $data = $this->normalizeInsertData($request->validated());

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
                'user_id'      => $user->id,
                'card_id'      => $data['card_id'],
                'due_day'      => $data['due_day'] ?? null,
                'closing_day'  => $data['closing_day'] ?? null,
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
                    'name' => $cardUser->card?->name ?? ('Cartão #' . $cardUser->id),
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

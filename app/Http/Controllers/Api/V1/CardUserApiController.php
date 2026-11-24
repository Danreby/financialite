<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Card\AttachCard;
use App\Actions\Card\DetachCardUser;
use App\Actions\Card\UpdateCardUser;
use App\Enums\TransacaoStatus;
use App\Enums\TransacaoType;
use App\Exceptions\CardAlreadyAttachedException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Card\AttachCardToUserRequest;
use App\Http\Requests\Card\UpdateCardDueDayRequest;
use App\Models\CardUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * api/v1/card-users: vínculos do usuário com cartões (inclusive do catálogo).
 *
 * Antes era o CardUserController web; formato e status mantidos.
 */
class CardUserApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', CardUser::class);

        $user = $request->user();

        $cardUsers = CardUser::with('card')
            ->forUser($user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return $this->success($cardUsers);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $cardUser = CardUser::with('card')
            ->forUser($user->id)
            ->findOrFail($id);

        return $this->success($cardUser);
    }

    public function store(AttachCardToUserRequest $request, AttachCard $attachCard): JsonResponse
    {
        $this->authorize('create', CardUser::class);

        try {
            $cardUser = $attachCard->handle($request->user(), $request->validated());
        } catch (CardAlreadyAttachedException) {
            return $this->error('Este cartão já está associado ao usuário.', 422);
        }

        return $this->success($cardUser->load('card'), 201);
    }

    /**
     * PUT|PATCH api/v1/card-users/{id}: vencimento, fechamento e limite do vínculo
     * (bandeira e descrição só para cartão próprio).
     */
    public function update(UpdateCardDueDayRequest $request, int $id, UpdateCardUser $updateCardUser): JsonResponse
    {
        return $this->success($updateCardUser->handle($request->user(), $id, $request->validated()));
    }

    public function destroy(Request $request, int $id, DetachCardUser $detachCardUser): JsonResponse
    {
        $detachCardUser->handle($request->user(), $id);

        return $this->success(['message' => 'Cartão desassociado do usuário.']);
    }

    public function stats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', CardUser::class);

        $user = $request->user();

        $stats = CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(function ($cardUser) {
                return [
                    'card_user_id' => $cardUser->id,
                    'card_id' => $cardUser->card_id,
                    'card_name' => $cardUser->card->name,
                    'total_faturas' => $cardUser->transacoes()->count(),
                    'paid_faturas' => $cardUser->transacoes()->where('status', TransacaoStatus::Paid)->count(),
                    'unpaid_faturas' => $cardUser->transacoes()->where('status', TransacaoStatus::Unpaid)->count(),
                    'overdue_faturas' => $cardUser->transacoes()->where('status', TransacaoStatus::Overdue)->count(),
                    'total_amount' => $cardUser->transacoes()->sum('amount'),
                    'income_amount' => $cardUser->transacoes()->where('type', TransacaoType::Credit)->sum('amount'),
                    'expense_amount' => $cardUser->transacoes()->where('type', TransacaoType::Debit)->sum('amount'),
                ];
            });

        return $this->success($stats);
    }
}

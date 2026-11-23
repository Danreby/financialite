<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Card\AttachCard;
use App\Actions\Card\DetachCardUser;
use App\Actions\Card\UpdateCardUser;
use App\Exceptions\CardAlreadyAttachedException;
use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\CardUser;
use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CardApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $monthStart = Carbon::now()->startOfMonth();

        // Pre-load current month spending per card_user_id
        $spendingMap = Transacao::forUser($user->id)
            ->where('type', 'debit')
            ->whereYear('created_at', $monthStart->year)
            ->whereMonth('created_at', $monthStart->month)
            ->whereNotNull('bank_user_id')
            ->selectRaw('bank_user_id, SUM(amount) as total')
            ->groupBy('bank_user_id')
            ->pluck('total', 'bank_user_id');

        $cardUsers = CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(fn ($cu) => [
                'id' => $cu->id,
                'user_id' => $cu->user_id,
                'card_id' => $cu->card_id,
                'name' => $cu->card?->name ?? ('Cartão #'.$cu->id),
                'brand' => $cu->card?->brand,
                'due_day' => $cu->due_day,
                'closing_day' => $cu->closing_day,
                'credit_limit' => $cu->credit_limit,
                'current_spending' => (float) ($spendingMap[$cu->id] ?? 0),
            ]);

        return $this->success($cardUsers);
    }

    public function availableCards(Request $request): JsonResponse
    {
        $cards = Card::visibleTo($request->user()->id)->orderBy('name')->get(['id', 'name', 'brand', 'description']);

        return $this->success($cards);
    }

    public function store(Request $request, AttachCard $attachCard): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'card_id' => [
                'required',
                Rule::exists('cards', 'id')->where(
                    fn ($q) => $q->whereNull('deleted_at')->where(
                        fn ($w) => $w->whereNull('user_id')->orWhere('user_id', $user->id)
                    )
                ),
            ],
            'due_day' => 'nullable|integer|min:1|max:31',
            'closing_day' => 'nullable|integer|min:1|max:31',
            'credit_limit' => 'nullable|numeric|min:0|max:999999999.99',
        ]);

        try {
            $cardUser = $attachCard->handle($user, $data);
        } catch (CardAlreadyAttachedException) {
            return $this->error('Você já possui este cartão.', 422);
        }

        return $this->success($cardUser->load('card'), 201);
    }

    public function update(Request $request, int $id, UpdateCardUser $updateCardUser): JsonResponse
    {
        $data = $request->validate([
            'due_day' => 'nullable|integer|min:1|max:31',
            'closing_day' => 'nullable|integer|min:1|max:31',
            'credit_limit' => 'nullable|numeric|min:0|max:999999999.99',
        ]);

        return $this->success($updateCardUser->handle($request->user(), $id, $data));
    }

    public function destroy(Request $request, int $id, DetachCardUser $detachCardUser): JsonResponse
    {
        $detachCardUser->handle($request->user(), $id);

        return $this->success(['message' => 'Cartão removido.']);
    }
}

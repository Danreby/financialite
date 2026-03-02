<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CardUser;
use App\Models\Card;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CardApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $cardUsers = CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(fn($cu) => [
                'id' => $cu->id,
                'card_id' => $cu->card_id,
                'name' => $cu->card?->name ?? ('Cartão #' . $cu->id),
                'brand' => $cu->card?->brand,
                'due_day' => $cu->due_day,
                'closing_day' => $cu->closing_day,
                'credit_limit' => $cu->credit_limit,
            ]);

        return $this->success($cardUsers);
    }

    public function availableCards(Request $request): JsonResponse
    {
        $cards = Card::orderBy('name')->get(['id', 'name', 'brand', 'description']);
        return $this->success($cards);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'card_id' => 'required|exists:cards,id',
            'due_day' => 'nullable|integer|min:1|max:31',
            'closing_day' => 'nullable|integer|min:1|max:31',
            'credit_limit' => 'nullable|numeric|min:0|max:999999999.99',
        ]);

        $existing = CardUser::where('user_id', $user->id)
            ->where('card_id', $request->card_id)
            ->first();

        if ($existing) {
            return $this->error('Você já possui este cartão.', 422);
        }

        $cardUser = CardUser::create([
            'user_id' => $user->id,
            'card_id' => $request->card_id,
            'due_day' => $request->due_day,
            'closing_day' => $request->closing_day,
            'credit_limit' => $request->credit_limit,
        ]);

        $cardUser->load('card');

        return $this->success($cardUser, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $cardUser = CardUser::forUser($user->id)->findOrFail($id);

        $request->validate([
            'due_day' => 'nullable|integer|min:1|max:31',
            'closing_day' => 'nullable|integer|min:1|max:31',
            'credit_limit' => 'nullable|numeric|min:0|max:999999999.99',
        ]);

        $cardUser->update($request->only(['due_day', 'closing_day', 'credit_limit']));
        $cardUser->load('card');

        return $this->success($cardUser);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $cardUser = CardUser::forUser($user->id)->findOrFail($id);
        $cardUser->delete();

        return $this->success(['message' => 'Cartão removido.']);
    }
}

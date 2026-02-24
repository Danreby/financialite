<?php

namespace App\Http\Controllers;

use App\Http\Requests\Card\AttachCardToUserRequest;
use App\Models\Card;
use App\Models\CardUser;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CardUserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

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

        $this->authorize('view', $cardUser);

        return $this->success($cardUser);
    }

    public function store(AttachCardToUserRequest $request): JsonResponse
    {
        $this->authorize('create', CardUser::class);

        $user = $request->user();

        $data = $this->normalizeInsertData($request->validated());

        $existing = CardUser::forUser($user->id)
            ->where('card_id', $data['card_id'])
            ->first();

        if ($existing) {
            return $this->error('Este cartão já está associado ao usuário.', 422);
        }

        $cardUser = DB::transaction(function () use ($data, $user) {
            return CardUser::create([
                'user_id' => $user->id,
                'card_id' => $data['card_id'],
            ]);
        });

        $cardUser->load('card');

        return $this->success($cardUser, 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $cardUser = CardUser::forUser($user->id)->findOrFail($id);

        $this->authorize('delete', $cardUser);

        DB::transaction(function () use ($cardUser) {
            $cardUser->delete();
        });

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
                    'paid_faturas' => $cardUser->transacoes()->where('status', 'paid')->count(),
                    'unpaid_faturas' => $cardUser->transacoes()->where('status', 'unpaid')->count(),
                    'overdue_faturas' => $cardUser->transacoes()->where('status', 'overdue')->count(),
                    'total_amount' => $cardUser->transacoes()->sum('amount'),
                    'income_amount' => $cardUser->transacoes()->where('type', 'credit')->sum('amount'),
                    'expense_amount' => $cardUser->transacoes()->where('type', 'debit')->sum('amount'),
                ];
            });

        return $this->success($stats);
    }
}

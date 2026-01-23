<?php

namespace App\Http\Controllers;

use App\Http\Requests\BankUser\BankUserStoreRequest;
use App\Models\Bank;
use App\Models\BankUser;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class BankUserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', BankUser::class);

        $user = $request->user();

        $bankUsers = BankUser::with('bank')
            ->forUser($user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return $this->success($bankUsers);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $bankUser = BankUser::with('bank')
            ->forUser($user->id)
            ->findOrFail($id);

        $this->authorize('view', $bankUser);

        return $this->success($bankUser);
    }

    public function store(BankUserStoreRequest $request): JsonResponse
    {
        $this->authorize('create', BankUser::class);

        $user = $request->user();

        $data = $this->normalizeInsertData($request->validated());

        $existing = BankUser::forUser($user->id)
            ->where('bank_id', $data['bank_id'])
            ->first();

        if ($existing) {
            return $this->error('Este banco já está associado ao usuário.', 422);
        }

        $bankUser = DB::transaction(function () use ($data, $user) {
            return BankUser::create([
                'user_id' => $user->id,
                'bank_id' => $data['bank_id'],
            ]);
        });

        $bankUser->load('bank');

        return $this->success($bankUser, 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $bankUser = BankUser::forUser($user->id)->findOrFail($id);

        $this->authorize('delete', $bankUser);

        DB::transaction(function () use ($bankUser) {
            $bankUser->delete();
        });

        return $this->success(['message' => 'Banco desassociado do usuário.']);
    }

    public function stats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', BankUser::class);

        $user = $request->user();

        $stats = BankUser::with('bank')
            ->forUser($user->id)
            ->get()
            ->map(function ($bankUser) {
                return [
                    'bank_user_id' => $bankUser->id,
                    'bank_id' => $bankUser->bank_id,
                    'bank_name' => $bankUser->bank->name,
                    'total_faturas' => $bankUser->transacoes()->count(),
                    'paid_faturas' => $bankUser->transacoes()->where('status', 'paid')->count(),
                    'unpaid_faturas' => $bankUser->transacoes()->where('status', 'unpaid')->count(),
                    'overdue_faturas' => $bankUser->transacoes()->where('status', 'overdue')->count(),
                    'total_amount' => $bankUser->transacoes()->sum('amount'),
                    'income_amount' => $bankUser->transacoes()->where('type', 'credit')->sum('amount'),
                    'expense_amount' => $bankUser->transacoes()->where('type', 'debit')->sum('amount'),
                ];
            });

        return $this->success($stats);
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\Bank\AttachBankToUserRequest;
use App\Http\Requests\Bank\BankStoreRequest;
use App\Http\Requests\Bank\BankUpdateRequest;
use App\Http\Requests\Bank\UpdateBankDueDayRequest;
use App\Models\Bank;
use App\Models\BankUser;
use App\Models\CardUser;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class BankController extends Controller
{
    public function __construct(private NotificationService $notifications)
    {
        $this->middleware('auth');
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Bank::class);

        $user = $request->user();
        
        $banks = Bank::forUser($user->id)
            ->ordered()
            ->paginate(20);
            
        return $this->success($banks);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        
        $bank = Bank::forUser($user->id)->findOrFail($id);
        
        $this->authorize('view', $bank);
        
        return $this->success($bank);
    }

    public function store(BankStoreRequest $request): JsonResponse
    {
        $this->authorize('create', Bank::class);

        $user = $request->user();
        
        $data = $this->normalizeInsertData($request->validated());
        $bank = DB::transaction(function () use ($data, $user) {
            $bank = Bank::create($data);

            CardUser::create([
                'bank_id' => $bank->id,
                'user_id' => $user->id,
            ]);

            $this->notifications->info($user, 'Banco adicionado', 'Um novo banco foi vinculado à sua conta.');

            return $bank;
        });

        return $this->success($bank, 201);
    }

    public function update(BankUpdateRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        
        $bank = Bank::forUser($user->id)->findOrFail($id);

        $this->authorize('update', $bank);

        $data = $request->validated();
        DB::transaction(function () use ($bank, $data, $user) {
            $bank->update($data);

            $this->notifications->info($user, 'Banco atualizado', 'As informações do banco foram atualizadas.');
        });

        return $this->success($bank);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        
        $bank = $user->banks()->findOrFail($id);
        
        $this->authorize('delete', $bank);
        
        DB::transaction(function () use ($user, $bank) {
            CardUser::forUser($user->id)
                ->forBank($bank->id)
                ->delete();

            $bank->delete();

            $this->notifications->info($user, 'Banco removido', 'Um banco foi desvinculado da sua conta.');
        });

        return $this->success(['message' => 'Banco removido.']);
    }

    public function list(Request $request): JsonResponse
    {
        $banks = Bank::ordered()->get(['id', 'name']);
        return $this->success($banks);
    }

    public function updateDueDay(UpdateBankDueDayRequest $request, BankUser $bankUser): JsonResponse
    {
        $this->authorize('update', $bankUser);

        $user = $request->user();
        $data = $request->validated();

        DB::transaction(function () use ($bankUser, $data, $user) {
            $bankUser->due_day = $data['due_day'];
            $bankUser->save();

            $this->notifications->info($user, 'Vencimento atualizado', 'O dia de vencimento da fatura foi atualizado.');
        });

        return $this->success([
            'message' => 'Dia de vencimento atualizado com sucesso.',
            'bank_user_id' => $bankUser->id,
            'due_day' => $data['due_day'],
        ]);
    }

    public function attachToUser(AttachBankToUserRequest $request): JsonResponse
    {
        $this->authorize('create', CardUser::class);

        $user = $request->user();

        $data = $this->normalizeInsertData($request->validated());

        $exists = CardUser::forUser($user->id)
            ->forBank($data['bank_id'])
            ->first();

        if ($exists) {
            $this->notifications->warning($user, 'Banco já vinculado', 'Tentativa de vincular um banco que já está associado à sua conta.');

            return $this->success([
                'already_attached' => true,
                'message' => 'Este banco já está vinculado ao usuário.',
                'bank_user' => $exists->load('bank'),
            ]);
        }

        $bankUser = DB::transaction(function () use ($data, $user) {
            $bankUser = CardUser::create([
                'user_id' => $user->id,
                'bank_id' => $data['bank_id'],
                'due_day' => $data['due_day'] ?? null,
            ]);

            $this->notifications->info($user, 'Conta vinculada', 'Uma conta de banco foi vinculada com sucesso.');

            return $bankUser;
        });

        return $this->success($bankUser->load('bank'), 201);
    }
}

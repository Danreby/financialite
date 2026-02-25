<?php

namespace App\Http\Controllers;

use App\Contracts\Services\BankAccountServiceInterface;
use App\Contracts\Services\BankTransferServiceInterface;
use App\Http\Requests\Bank\BankStoreRequest;
use App\Http\Requests\Bank\BankUpdateRequest;
use App\Http\Requests\Bank\BankTransferRequest;
use App\Models\Bank;
use App\Models\BankUser;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class BankController extends Controller
{
    public function __construct(
        private BankAccountServiceInterface $bankAccountService,
        private BankTransferServiceInterface $bankTransferService,
        private NotificationService $notifications,
    ) {
        $this->middleware('auth');
    }

    public function page(Request $request): Response
    {
        $user = $request->user();
        $stats = $this->bankAccountService->getStats($user->id);
        $transfers = $this->bankTransferService->listForUser($user->id, 15);

        return Inertia::render('Bancos', [
            'stats'     => $stats,
            'transfers' => $transfers->map(fn ($t) => [
                'id'          => $t->id,
                'from_bank'   => $t->fromBankUser?->bank?->name ?? '—',
                'to_bank'     => $t->toBankUser?->bank?->name ?? '—',
                'amount'      => (float) $t->amount,
                'description' => $t->description,
                'created_at'  => $t->created_at?->toIso8601String(),
            ]),
        ]);
    }

    public function listBanks(Request $request): JsonResponse
    {
        $banks = Bank::withoutTrashed()->ordered()->get(['id', 'name']);

        return $this->success($banks);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Bank::class);

        $accounts = $this->bankAccountService->listForUser($request->user()->id);

        return $this->success($accounts->load('bank'));
    }

    public function stats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Bank::class);

        $stats = $this->bankAccountService->getStats($request->user()->id);

        return $this->success($stats);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $bankUser = BankUser::with('bank')->forUser($user->id)->findOrFail($id);
        $this->authorize('view', $bankUser);

        $detail = $this->bankAccountService->getBankDetail($user->id, $id);

        return $this->success($detail);
    }

    public function store(BankStoreRequest $request): JsonResponse
    {
        $this->authorize('create', Bank::class);

        $user = $request->user();
        $data = $request->validated();

        try {
            $bankUser = $this->bankAccountService->createForUser($user, $data);
            $bankUser->load('bank');

            $this->notifications->info($user, 'Banco adicionado', "Conta do banco \"{$bankUser->bank->name}\" foi vinculada.");

            return $this->success($bankUser, 201);
        } catch (\DomainException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao adicionar banco.');
        }
    }

    public function update(BankUpdateRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $bankUser = BankUser::forUser($user->id)->findOrFail($id);

        $this->authorize('update', $bankUser);

        $data = $request->validated();

        try {
            $bankUser = $this->bankAccountService->updateBalance($bankUser, (float) $data['balance']);
            $bankUser->load('bank');

            $this->notifications->info($user, 'Saldo atualizado', 'O saldo da conta bancária foi atualizado.');

            return $this->success($bankUser);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao atualizar saldo.');
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $bankUser = BankUser::forUser($user->id)->findOrFail($id);

        $this->authorize('delete', $bankUser);

        try {
            $this->bankAccountService->deleteForUser($bankUser);

            $this->notifications->info($user, 'Banco removido', 'Uma conta bancária foi removida.');

            return $this->success(['message' => 'Conta bancária removida.']);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao remover conta bancária.');
        }
    }

    public function transfer(BankTransferRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        try {
            $transfer = $this->bankTransferService->transfer($user, $data);
            $transfer->load(['fromBankUser.bank', 'toBankUser.bank']);

            $this->notifications->info(
                $user,
                'Transferência realizada',
                "Transferência de R$ " . number_format($transfer->amount, 2, ',', '.') . " realizada com sucesso."
            );

            return $this->success($transfer, 201);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao realizar transferência.');
        }
    }

    public function transfers(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Bank::class);

        $transfers = $this->bankTransferService->listForUser($request->user()->id);

        return $this->success($transfers->map(fn ($t) => [
            'id'          => $t->id,
            'from_bank'   => $t->fromBankUser?->bank?->name ?? '—',
            'to_bank'     => $t->toBankUser?->bank?->name ?? '—',
            'amount'      => (float) $t->amount,
            'description' => $t->description,
            'created_at'  => $t->created_at?->toIso8601String(),
        ]));
    }
}

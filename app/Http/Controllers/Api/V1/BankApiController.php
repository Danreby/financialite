<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\Services\BankAccountServiceInterface;
use App\Contracts\Services\BankTransferServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Bank\BankStoreRequest;
use App\Http\Requests\Bank\BankTransferRequest;
use App\Http\Requests\Bank\BankUpdateRequest;
use App\Models\Bank;
use App\Models\BankUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankApiController extends Controller
{
    public function __construct(
        private BankAccountServiceInterface $bankAccountService,
        private BankTransferServiceInterface $bankTransferService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $accounts = $this->bankAccountService->listForUser($user->id);

        return $this->success($accounts);
    }

    public function availableBanks(Request $request): JsonResponse
    {
        $banks = Bank::orderBy('name')->get(['id', 'name']);

        return $this->success($banks);
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $stats = $this->bankAccountService->getStats($user->id);

        return $this->success($stats);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $detail = $this->bankAccountService->getBankDetail($user->id, $id);

        return $this->success($detail);
    }

    public function store(BankStoreRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        try {
            $bankUser = $this->bankAccountService->createForUser($user, $data);

            return $this->success($bankUser, 201);
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao criar conta bancária.');
        }
    }

    public function update(BankUpdateRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $bankUser = BankUser::forUser($user->id)->findOrFail($id);

        try {
            $bankUser = $this->bankAccountService->updateBalance($bankUser, $request->validated('balance'));

            return $this->success($bankUser);
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao atualizar conta bancária.');
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $bankUser = BankUser::forUser($user->id)->findOrFail($id);

        try {
            $this->bankAccountService->deleteForUser($bankUser);

            return $this->success(['message' => 'Conta bancária removida.']);
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao remover conta bancária.');
        }
    }

    public function transfer(BankTransferRequest $request): JsonResponse
    {
        $user = $request->user();

        try {
            $transfer = $this->bankTransferService->transfer($user, $request->validated());

            return $this->success($transfer, 201);
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao realizar transferência.');
        }
    }

    public function transfers(Request $request): JsonResponse
    {
        $user = $request->user();
        $bankUserId = $request->input('bank_user_id');
        $transfers = $this->bankTransferService->listForUser($user->id, $bankUserId);

        return $this->success($transfers);
    }
}

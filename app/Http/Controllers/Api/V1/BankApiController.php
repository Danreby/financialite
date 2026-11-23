<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Bank\CreateBankAccount;
use App\Actions\Bank\DeleteBankAccount;
use App\Actions\Bank\TransferBetweenAccounts;
use App\Actions\Bank\UpdateBankBalance;
use App\Contracts\Services\BankAccountServiceInterface;
use App\Contracts\Services\BankTransferServiceInterface;
use App\Exceptions\BankAccountHasMovementsException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Bank\BankStoreRequest;
use App\Http\Requests\Bank\BankTransferRequest;
use App\Http\Requests\Bank\BankUpdateRequest;
use App\Models\Bank;
use App\Models\BankLedgerEntry;
use App\Models\BankUser;
use App\Services\BankLedgerService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankApiController extends Controller
{
    public function __construct(
        private BankAccountServiceInterface $bankAccountService,
        private BankTransferServiceInterface $bankTransferService,
        private BankLedgerService $bankLedgerService,
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

    public function ledger(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $bankUser = BankUser::forUser($user->id)->findOrFail($id);

        $entries = $this->bankLedgerService->statementForAccount($bankUser);

        return $this->success([
            'data' => collect($entries->items())->map(fn (BankLedgerEntry $entry) => [
                'id' => $entry->id,
                'type' => $entry->type,
                'type_label' => BankLedgerEntry::TYPE_LABELS[$entry->type] ?? $entry->type,
                'amount' => (float) $entry->amount,
                'balance_after' => (float) $entry->balance_after,
                'description' => $entry->description,
                'created_at' => $entry->created_at?->toIso8601String(),
            ]),
            'current_page' => $entries->currentPage(),
            'last_page' => $entries->lastPage(),
            'total' => $entries->total(),
        ]);
    }

    public function activity(Request $request): JsonResponse
    {
        $user = $request->user();

        $entries = $this->bankLedgerService->statementForUser($user->id, (int) $request->input('per_page', 20));

        return $this->success([
            'data' => collect($entries->items())->map(fn (BankLedgerEntry $entry) => [
                'id' => $entry->id,
                'type' => $entry->type,
                'type_label' => BankLedgerEntry::TYPE_LABELS[$entry->type] ?? $entry->type,
                'amount' => (float) $entry->amount,
                'balance_after' => (float) $entry->balance_after,
                'description' => $entry->description,
                'bank_user_id' => $entry->bank_user_id,
                'bank_name' => $entry->bankUser?->bank?->name ?? 'Conta',
                'created_at' => $entry->created_at?->toIso8601String(),
            ]),
            'current_page' => $entries->currentPage(),
            'last_page' => $entries->lastPage(),
            'total' => $entries->total(),
        ]);
    }

    public function store(BankStoreRequest $request, CreateBankAccount $createAccount): JsonResponse
    {
        try {
            return $this->success($createAccount->handle($request->user(), $request->validated()), 201);
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao criar conta bancária.');
        }
    }

    public function update(BankUpdateRequest $request, int $id, UpdateBankBalance $updateBalance): JsonResponse
    {
        try {
            return $this->success($updateBalance->handle($request->user(), $id, $request->validated('balance')));
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao atualizar conta bancária.');
        }
    }

    public function destroy(Request $request, int $id, DeleteBankAccount $deleteAccount): JsonResponse
    {
        try {
            $deleteAccount->handle($request->user(), $id);

            return $this->success(['message' => 'Conta bancária removida.']);
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (BankAccountHasMovementsException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao remover conta bancária.');
        }
    }

    public function transfer(BankTransferRequest $request, TransferBetweenAccounts $transferBetween): JsonResponse
    {
        try {
            return $this->success($transferBetween->handle($request->user(), $request->validated()), 201);
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

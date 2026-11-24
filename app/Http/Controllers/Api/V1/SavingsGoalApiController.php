<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\SavingsGoal\CreateSavingsGoal;
use App\Actions\SavingsGoal\DeleteSavingsGoal;
use App\Actions\SavingsGoal\DepositToSavingsGoal;
use App\Actions\SavingsGoal\UpdateSavingsGoal;
use App\Actions\SavingsGoal\WithdrawFromSavingsGoal;
use App\Contracts\Services\SavingsGoalServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\SavingsGoal\SavingsGoalStoreRequest;
use App\Http\Requests\SavingsGoal\SavingsGoalTransactionRequest;
use App\Http\Requests\SavingsGoal\SavingsGoalUpdateRequest;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavingsGoalApiController extends Controller
{
    public function __construct(
        private SavingsGoalServiceInterface $savingsService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return $this->success($this->savingsService->listForUser($request->user()->id));
    }

    public function store(SavingsGoalStoreRequest $request, CreateSavingsGoal $createGoal): JsonResponse
    {
        try {
            return $this->success($createGoal->handle($request->user(), $request->validated()), 201);
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao criar meta de economia.');
        }
    }

    public function update(SavingsGoalUpdateRequest $request, int $savingsGoal, UpdateSavingsGoal $updateGoal): JsonResponse
    {
        try {
            return $this->success($updateGoal->handle($request->user(), $savingsGoal, $request->validated()));
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao atualizar meta.');
        }
    }

    public function destroy(Request $request, int $savingsGoal, DeleteSavingsGoal $deleteGoal): JsonResponse
    {
        try {
            $deleteGoal->handle($request->user(), $savingsGoal);

            return $this->success(['message' => 'Meta removida.']);
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao remover meta.');
        }
    }

    public function deposit(SavingsGoalTransactionRequest $request, int $savingsGoal, DepositToSavingsGoal $deposit): JsonResponse
    {
        try {
            return $this->success($deposit->handle($request->user(), $savingsGoal, $request->validated('amount')));
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao depositar na meta.');
        }
    }

    public function withdraw(SavingsGoalTransactionRequest $request, int $savingsGoal, WithdrawFromSavingsGoal $withdraw): JsonResponse
    {
        try {
            return $this->success($withdraw->handle($request->user(), $savingsGoal, $request->validated('amount')));
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\DomainException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao retirar da meta.');
        }
    }

    public function summary(Request $request): JsonResponse
    {
        return $this->success($this->savingsService->summaryForUser($request->user()->id));
    }
}

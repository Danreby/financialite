<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\Services\SavingsGoalServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\SavingsGoal\SavingsGoalStoreRequest;
use App\Http\Requests\SavingsGoal\SavingsGoalUpdateRequest;
use App\Http\Requests\SavingsGoal\SavingsGoalTransactionRequest;
use App\Models\SavingsGoal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavingsGoalApiController extends Controller
{
    public function __construct(
        private SavingsGoalServiceInterface $savingsService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $goals = $this->savingsService->listForUser($user->id);

        return $this->success($goals);
    }

    public function store(SavingsGoalStoreRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $this->normalizeInsertData($request->validated());

        try {
            $goal = $this->savingsService->createForUser($user, $data);
            return $this->success($goal, 201);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao criar meta de economia.');
        }
    }

    public function update(SavingsGoalUpdateRequest $request, SavingsGoal $savingsGoal): JsonResponse
    {
        $this->authorize('update', $savingsGoal);
        $data = $this->normalizeInsertData($request->validated());

        try {
            $goal = $this->savingsService->updateForUser($savingsGoal, $data);
            return $this->success($goal);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao atualizar meta.');
        }
    }

    public function destroy(Request $request, SavingsGoal $savingsGoal): JsonResponse
    {
        $this->authorize('delete', $savingsGoal);

        try {
            $this->savingsService->deleteForUser($savingsGoal);
            return $this->success(['message' => 'Meta removida.']);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao remover meta.');
        }
    }

    public function deposit(SavingsGoalTransactionRequest $request, SavingsGoal $savingsGoal): JsonResponse
    {
        $this->authorize('update', $savingsGoal);

        try {
            $goal = $this->savingsService->deposit($savingsGoal, $request->validated('amount'));
            return $this->success($goal);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao depositar na meta.');
        }
    }

    public function withdraw(SavingsGoalTransactionRequest $request, SavingsGoal $savingsGoal): JsonResponse
    {
        $this->authorize('update', $savingsGoal);

        try {
            $goal = $this->savingsService->withdraw($savingsGoal, $request->validated('amount'));
            return $this->success($goal);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao retirar da meta.');
        }
    }

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $summary = $this->savingsService->summaryForUser($user->id);

        return $this->success($summary);
    }
}

<?php

namespace App\Http\Controllers;

use App\Contracts\Services\SavingsGoalServiceInterface;
use App\Http\Requests\SavingsGoal\SavingsGoalStoreRequest;
use App\Http\Requests\SavingsGoal\SavingsGoalUpdateRequest;
use App\Http\Requests\SavingsGoal\SavingsGoalTransactionRequest;
use App\Models\SavingsGoal;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavingsGoalController extends Controller
{
    public function __construct(
        private SavingsGoalServiceInterface $savingsService,
        private NotificationService $notifications
    ) {
        $this->middleware('auth');
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SavingsGoal::class);

        $goals = $this->savingsService->listForUser($request->user()->id);

        return $this->success($goals);
    }

    public function store(SavingsGoalStoreRequest $request): JsonResponse
    {
        $this->authorize('create', SavingsGoal::class);

        $user = $request->user();
        $data = $request->validated();

        try {
            $goal = $this->savingsService->createForUser($user, $data);

            $this->notifications->info($user, 'Meta criada', "\"{$goal->title}\" foi adicionado às suas metas.");

            return $this->success($goal, 201);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao criar meta de economia.');
        }
    }

    public function update(SavingsGoalUpdateRequest $request, SavingsGoal $savingsGoal): JsonResponse
    {
        $this->authorize('update', $savingsGoal);

        try {
            $goal = $this->savingsService->updateForUser($savingsGoal, $request->validated());

            return $this->success($goal);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao atualizar meta de economia.');
        }
    }

    public function deposit(SavingsGoalTransactionRequest $request, SavingsGoal $savingsGoal): JsonResponse
    {
        $this->authorize('deposit', $savingsGoal);

        $user = $request->user();
        $amount = (float) $request->validated()['amount'];

        try {
            $goal = $this->savingsService->deposit($savingsGoal, $amount);

            if ($goal->is_completed) {
                $this->notifications->info($user, 'Meta alcançada! 🎉', "Parabéns! Você atingiu a meta \"{$goal->title}\".");
            }

            return $this->success($goal);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao depositar.');
        }
    }

    public function withdraw(SavingsGoalTransactionRequest $request, SavingsGoal $savingsGoal): JsonResponse
    {
        $this->authorize('withdraw', $savingsGoal);

        $amount = (float) $request->validated()['amount'];

        if ($amount > (float) $savingsGoal->current_amount) {
            return $this->error('Valor de retirada excede o saldo disponível.', 422);
        }

        try {
            $goal = $this->savingsService->withdraw($savingsGoal, $amount);

            return $this->success($goal);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao retirar.');
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

    public function summary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SavingsGoal::class);

        $summary = $this->savingsService->summaryForUser($request->user()->id);

        return $this->success($summary);
    }
}

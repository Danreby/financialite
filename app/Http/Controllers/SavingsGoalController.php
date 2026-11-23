<?php

namespace App\Http\Controllers;

use App\Actions\SavingsGoal\CreateSavingsGoal;
use App\Actions\SavingsGoal\DeleteSavingsGoal;
use App\Actions\SavingsGoal\DepositToSavingsGoal;
use App\Actions\SavingsGoal\UpdateSavingsGoal;
use App\Actions\SavingsGoal\WithdrawFromSavingsGoal;
use App\Contracts\Services\SavingsGoalServiceInterface;
use App\Http\Requests\SavingsGoal\SavingsGoalStoreRequest;
use App\Http\Requests\SavingsGoal\SavingsGoalTransactionRequest;
use App\Http\Requests\SavingsGoal\SavingsGoalUpdateRequest;
use App\Models\SavingsGoal;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
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

        return $this->success($this->savingsService->listForUser($request->user()->id));
    }

    public function store(SavingsGoalStoreRequest $request, CreateSavingsGoal $createGoal): JsonResponse
    {
        $this->authorize('create', SavingsGoal::class);

        $user = $request->user();

        try {
            $goal = $createGoal->handle($user, $request->validated());

            $this->notifications->info($user, 'Meta criada', "\"{$goal->title}\" foi adicionado às suas metas.");

            return $this->success($goal, 201);
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

            return $this->serverError('Erro ao atualizar meta de economia.');
        }
    }

    public function deposit(SavingsGoalTransactionRequest $request, int $savingsGoal, DepositToSavingsGoal $deposit): JsonResponse
    {
        $user = $request->user();

        try {
            $goal = $deposit->handle($user, $savingsGoal, $request->validated('amount'));

            if ($goal->is_completed) {
                $this->notifications->info($user, 'Meta alcançada! 🎉', "Parabéns! Você atingiu a meta \"{$goal->title}\".");
            }

            return $this->success($goal);
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao depositar.');
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

            return $this->serverError('Erro ao retirar.');
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

    public function summary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SavingsGoal::class);

        return $this->success($this->savingsService->summaryForUser($request->user()->id));
    }
}

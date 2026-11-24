<?php

namespace App\Http\Controllers;

use App\Actions\Income\CreateIncome;
use App\Actions\Income\DeleteIncome;
use App\Actions\Income\ToggleIncomeActive;
use App\Actions\Income\ToggleIncomeAutoDeposit;
use App\Actions\Income\UpdateIncome;
use App\Contracts\Services\IncomeServiceInterface;
use App\Http\Requests\Income\IncomeStoreRequest;
use App\Http\Requests\Income\IncomeUpdateRequest;
use App\Models\Income;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncomeController extends Controller
{
    public function __construct(
        private IncomeServiceInterface $incomeService,
        private NotificationService $notifications
    ) {
        $this->middleware('auth');
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Income::class);

        // Profile page only shows recurring income sources.
        $incomes = $this->incomeService->listRecurringForUser($request->user()->id);

        return $this->success($incomes);
    }

    public function store(IncomeStoreRequest $request, CreateIncome $createIncome): JsonResponse
    {
        $this->authorize('create', Income::class);

        $user = $request->user();
        $data = $request->validated();

        try {
            $income = $createIncome->handle($user, $data);
            $income->load('bankUser.card');

            $isActive = $data['is_active'] ?? true;
            $this->notifications->info(
                $user,
                $isActive ? 'Renda cadastrada' : 'Entrada avulsa registrada',
                $isActive ? "A renda \"{$income->title}\" foi adicionada." : "A entrada \"{$income->title}\" foi registrada."
            );

            return $this->success($income, 201);
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao cadastrar renda.');
        }
    }

    public function update(IncomeUpdateRequest $request, int $income, UpdateIncome $updateIncome): JsonResponse
    {
        try {
            $updated = $updateIncome->handle($request->user(), $income, $request->validated());

            return $this->success($updated->load('bankUser.card'));
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao atualizar renda.');
        }
    }

    public function toggleActive(Request $request, int $income, ToggleIncomeActive $toggleActive): JsonResponse
    {
        try {
            return $this->success($toggleActive->handle($request->user(), $income));
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao alterar status da renda.');
        }
    }

    public function toggleAutoDeposit(Request $request, int $income, ToggleIncomeAutoDeposit $toggleAutoDeposit): JsonResponse
    {
        try {
            return $this->success($toggleAutoDeposit->handle($request->user(), $income));
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao alterar depósito automático da renda.');
        }
    }

    public function destroy(Request $request, int $income, DeleteIncome $deleteIncome): JsonResponse
    {
        $user = $request->user();

        try {
            $deleteIncome->handle($user, $income);
            $this->notifications->info($user, 'Renda removida', 'Uma fonte de renda foi removida.');

            return $this->success(['message' => 'Renda removida.']);
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao remover renda.');
        }
    }

    public function summary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Income::class);

        $totalMonthly = $this->incomeService->totalMonthlyIncome($request->user()->id);

        return $this->success([
            'total_monthly_income' => $totalMonthly,
        ]);
    }
}

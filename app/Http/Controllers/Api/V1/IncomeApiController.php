<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Income\CreateIncome;
use App\Actions\Income\DeleteIncome;
use App\Actions\Income\ToggleIncomeActive;
use App\Actions\Income\ToggleIncomeAutoDeposit;
use App\Actions\Income\UpdateIncome;
use App\Contracts\Services\IncomeServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Income\IncomeStoreRequest;
use App\Http\Requests\Income\IncomeUpdateRequest;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncomeApiController extends Controller
{
    public function __construct(
        private IncomeServiceInterface $incomeService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return $this->success($this->incomeService->listForUser($request->user()->id));
    }

    public function store(IncomeStoreRequest $request, CreateIncome $createIncome): JsonResponse
    {
        try {
            return $this->success($createIncome->handle($request->user(), $request->validated()), 201);
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao criar receita.');
        }
    }

    public function update(IncomeUpdateRequest $request, int $income, UpdateIncome $updateIncome): JsonResponse
    {
        try {
            return $this->success($updateIncome->handle($request->user(), $income, $request->validated()));
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao atualizar receita.');
        }
    }

    public function destroy(Request $request, int $income, DeleteIncome $deleteIncome): JsonResponse
    {
        try {
            $deleteIncome->handle($request->user(), $income);

            return $this->success(['message' => 'Receita removida.']);
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao remover receita.');
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

            return $this->serverError('Erro ao alternar status da receita.');
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

            return $this->serverError('Erro ao alternar depósito automático da receita.');
        }
    }

    public function summary(Request $request): JsonResponse
    {
        $total = $this->incomeService->totalMonthlyIncome($request->user()->id);

        return $this->success(['total_monthly_income' => $total]);
    }
}

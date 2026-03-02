<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\Services\IncomeServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Income\IncomeStoreRequest;
use App\Http\Requests\Income\IncomeUpdateRequest;
use App\Models\Income;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncomeApiController extends Controller
{
    public function __construct(
        private IncomeServiceInterface $incomeService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $incomes = $this->incomeService->listForUser($user->id);

        return $this->success($incomes);
    }

    public function store(IncomeStoreRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $this->normalizeInsertData($request->validated());

        try {
            $income = $this->incomeService->createForUser($user, $data);
            return $this->success($income, 201);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao criar receita.');
        }
    }

    public function update(IncomeUpdateRequest $request, Income $income): JsonResponse
    {
        $this->authorize('update', $income);
        $data = $this->normalizeInsertData($request->validated());

        try {
            $income = $this->incomeService->updateForUser($income, $data);
            return $this->success($income);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao atualizar receita.');
        }
    }

    public function destroy(Request $request, Income $income): JsonResponse
    {
        $this->authorize('delete', $income);

        try {
            $this->incomeService->deleteForUser($income);
            return $this->success(['message' => 'Receita removida.']);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao remover receita.');
        }
    }

    public function toggleActive(Request $request, Income $income): JsonResponse
    {
        $this->authorize('update', $income);

        try {
            $income = $this->incomeService->toggleActive($income);
            return $this->success($income);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao alternar status da receita.');
        }
    }

    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $total = $this->incomeService->totalMonthlyIncome($user->id);

        return $this->success(['total_monthly_income' => $total]);
    }
}

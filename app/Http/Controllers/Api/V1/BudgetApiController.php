<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Budget\CreateBudget;
use App\Actions\Budget\DeleteBudget;
use App\Actions\Budget\GetOrCreateCurrentBudget;
use App\Actions\Budget\UpdateBudget;
use App\Enums\TransacaoType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Budget\BudgetStoreRequest;
use App\Http\Requests\Budget\BudgetUpdateRequest;
use App\Models\Budget;
use App\Models\Transacao;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BudgetApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $budgets = Budget::where('user_id', $user->id)
            ->with('budgetCategories.category')
            ->orderByDesc('month_year')
            ->get();

        return $this->success($budgets);
    }

    public function current(Request $request): JsonResponse
    {
        $user = $request->user();
        $monthYear = Carbon::now()->format('Y-m');

        $budget = Budget::where('user_id', $user->id)
            ->where('month_year', $monthYear)
            ->with('budgetCategories.category')
            ->first();

        if (! $budget) {
            return $this->success(null);
        }

        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        $totalSpent = Transacao::where('user_id', $user->id)
            ->where('type', TransacaoType::Debit)
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $categorySpending = Transacao::where('user_id', $user->id)
            ->where('type', TransacaoType::Debit)
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->whereNotNull('category_id')
            ->select('category_id', DB::raw('SUM(amount) as total'))
            ->groupBy('category_id')
            ->pluck('total', 'category_id');

        $categories = $budget->budgetCategories->map(function ($bc) use ($categorySpending) {
            return [
                ...$bc->toArray(),
                'spent' => (float) ($categorySpending[$bc->category_id] ?? 0),
                'remaining' => max(0, $bc->limit - ($categorySpending[$bc->category_id] ?? 0)),
                'percentage' => $bc->limit > 0
                    ? min(100, round(($categorySpending[$bc->category_id] ?? 0) / $bc->limit * 100, 1))
                    : 0,
            ];
        });

        return $this->success([
            'budget' => $budget,
            'total_spent' => (float) $totalSpent,
            'remaining' => max(0, $budget->monthly_limit - $totalSpent),
            'percentage' => $budget->monthly_limit > 0
                ? min(100, round($totalSpent / $budget->monthly_limit * 100, 1))
                : 0,
            'categories' => $categories,
        ]);
    }

    public function store(BudgetStoreRequest $request, CreateBudget $createBudget): JsonResponse
    {
        try {
            $budget = $createBudget->handle($request->user(), $request->validated());

            return $this->success($budget->load('budgetCategories.category'), 201);
        } catch (\DomainException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao criar orçamento.');
        }
    }

    public function update(BudgetUpdateRequest $request, int $budget, UpdateBudget $updateBudget): JsonResponse
    {
        try {
            $updated = $updateBudget->handle($request->user(), $budget, $request->validated());

            return $this->success($updated->load('budgetCategories.category'));
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao atualizar orçamento.');
        }
    }

    public function destroy(Request $request, int $budget, DeleteBudget $deleteBudget): JsonResponse
    {
        $deleteBudget->handle($request->user(), $budget);

        return $this->success(['message' => 'Orçamento removido.']);
    }

    public function getOrCreateCurrent(Request $request, GetOrCreateCurrentBudget $getOrCreate): JsonResponse
    {
        $user = $request->user();
        $budget = $getOrCreate->handle($user)->load('budgetCategories.category');
        $recommendedCents = GetOrCreateCurrentBudget::recommendedLimitCents($user);

        // recommended_limit explica de onde veio o limite de um orçamento recém-criado
        // (80% da renda ativa; sem renda, o padrão de R$ 5.000,00).
        return $this->success([
            ...$budget->toArray(),
            'recommended_limit' => $recommendedCents === null ? null : $recommendedCents / 100.0,
        ]);
    }
}

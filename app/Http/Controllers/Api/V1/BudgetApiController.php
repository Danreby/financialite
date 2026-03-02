<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Budget\BudgetStoreRequest;
use App\Http\Requests\Budget\BudgetUpdateRequest;
use App\Models\Budget;
use App\Models\BudgetCategory;
use App\Models\Transacao;
use Carbon\Carbon;
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

        if (!$budget) {
            return $this->success(null);
        }

        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        $totalSpent = Transacao::where('user_id', $user->id)
            ->where('type', 'debit')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $categorySpending = Transacao::where('user_id', $user->id)
            ->where('type', 'debit')
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

    public function store(BudgetStoreRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        try {
            $budget = DB::transaction(function () use ($user, $data) {
                $budget = Budget::create([
                    'monthly_limit' => $data['monthly_limit'],
                    'month_year' => $data['month_year'],
                    'is_active' => true,
                    'user_id' => $user->id,
                ]);

                if (!empty($data['category_limits'])) {
                    foreach ($data['category_limits'] as $cl) {
                        BudgetCategory::create([
                            'budget_id' => $budget->id,
                            'category_id' => $cl['category_id'],
                            'limit' => $cl['limit'],
                        ]);
                    }
                }

                return $budget->load('budgetCategories.category');
            });

            return $this->success($budget, 201);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao criar orçamento.');
        }
    }

    public function update(BudgetUpdateRequest $request, Budget $budget): JsonResponse
    {
        $this->authorize('update', $budget);
        $data = $request->validated();

        try {
            DB::transaction(function () use ($budget, $data) {
                $budget->update([
                    'monthly_limit' => $data['monthly_limit'] ?? $budget->monthly_limit,
                    'month_year' => $data['month_year'] ?? $budget->month_year,
                ]);

                if (isset($data['category_limits'])) {
                    $budget->budgetCategories()->delete();
                    foreach ($data['category_limits'] as $cl) {
                        BudgetCategory::create([
                            'budget_id' => $budget->id,
                            'category_id' => $cl['category_id'],
                            'limit' => $cl['limit'],
                        ]);
                    }
                }
            });

            $budget->load('budgetCategories.category');
            return $this->success($budget);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao atualizar orçamento.');
        }
    }

    public function destroy(Request $request, Budget $budget): JsonResponse
    {
        $this->authorize('delete', $budget);
        $budget->budgetCategories()->delete();
        $budget->delete();

        return $this->success(['message' => 'Orçamento removido.']);
    }

    public function getOrCreateCurrent(Request $request): JsonResponse
    {
        $user = $request->user();
        $monthYear = Carbon::now()->format('Y-m');

        $budget = Budget::firstOrCreate(
            ['user_id' => $user->id, 'month_year' => $monthYear],
            ['monthly_limit' => 0, 'is_active' => true]
        );

        $budget->load('budgetCategories.category');
        return $this->success($budget);
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\Budget\BudgetStoreRequest;
use App\Http\Requests\Budget\BudgetUpdateRequest;
use App\Models\Budget;
use App\Models\BudgetCategory;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class BudgetController extends Controller
{
    public function __construct(private NotificationService $notifications)
    {
        $this->middleware('auth');
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Budget::class);

        $user = $request->user();

        $budgets = Budget::forUser($user->id)
            ->with(['categoryLimits.category:id,name,color,icon'])
            ->orderBy('month_year', 'desc')
            ->get();

        return $this->success($budgets);
    }

    public function current(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Budget::class);

        $user = $request->user();
        $currentMonth = now()->format('Y-m');

        $monthlyIncome = (float) \App\Models\Income::forUser($user->id)
            ->where('is_active', true)
            ->sum('amount');

        $recommendedLimit = $monthlyIncome > 0 ? round($monthlyIncome * 0.8, 2) : null;

        $budget = Budget::forUser($user->id)
            ->forMonth($currentMonth)
            ->with(['categoryLimits.category:id,name,color,icon'])
            ->first();

        if (!$budget) {
            return $this->success([
                'monthly_income' => $monthlyIncome,
                'recommended_limit' => $recommendedLimit,
            ]);
        }

        $totalSpent = $budget->getCurrentSpending();
        $categorySpending = $budget->getCategorySpending();

        $budgetData = $budget->toArray();
        $budgetData['total_spent'] = $totalSpent;
        $budgetData['remaining'] = max(0, $budget->monthly_limit - $totalSpent);
        $budgetData['percentage'] = $budget->monthly_limit > 0 
            ? min(100, ($totalSpent / $budget->monthly_limit) * 100) 
            : 0;
        $budgetData['monthly_income'] = $monthlyIncome;
        $budgetData['recommended_limit'] = $recommendedLimit;

        if (isset($budgetData['category_limits'])) {
            foreach ($budgetData['category_limits'] as &$categoryLimit) {
                $categoryId = $categoryLimit['category_id'];
                $spent = $categorySpending[$categoryId]['total'] ?? 0;
                
                $categoryLimit['spent'] = $spent;
                $categoryLimit['remaining'] = max(0, $categoryLimit['limit'] - $spent);
                $categoryLimit['percentage'] = $categoryLimit['limit'] > 0 
                    ? min(100, ($spent / $categoryLimit['limit']) * 100) 
                    : 0;
            }
        }

        return $this->success($budgetData);
    }

    public function store(BudgetStoreRequest $request): JsonResponse
    {
        $this->authorize('create', Budget::class);

        $user = $request->user();
        $data = $request->validated();

        $budget = DB::transaction(function () use ($data, $user) {
            // Check if budget already exists for this month
            $existing = Budget::forUser($user->id)
                ->forMonth($data['month_year'])
                ->first();

            if ($existing) {
                throw new \Exception('Já existe um orçamento para este mês.');
            }

            $budget = Budget::create([
                'monthly_limit' => $data['monthly_limit'],
                'month_year' => $data['month_year'],
                'is_active' => $data['is_active'] ?? true,
                'user_id' => $user->id,
            ]);

            // Create category limits if provided
            if (!empty($data['category_limits'])) {
                foreach ($data['category_limits'] as $categoryLimit) {
                    BudgetCategory::create([
                        'budget_id' => $budget->id,
                        'category_id' => $categoryLimit['category_id'],
                        'limit' => $categoryLimit['limit'],
                    ]);
                }
            }

            $this->notifications->success($user, 'Orçamento criado', 'Novo orçamento mensal foi criado com sucesso.');

            return $budget->load('categoryLimits.category:id,name,color,icon');
        });

        return $this->success($budget, 201);
    }

    public function update(BudgetUpdateRequest $request, Budget $budget): JsonResponse
    {
        $this->authorize('update', $budget);

        $user = $request->user();
        $data = $request->validated();

        DB::transaction(function () use ($budget, $data, $user) {
            $budget->update([
                'monthly_limit' => $data['monthly_limit'] ?? $budget->monthly_limit,
                'is_active' => $data['is_active'] ?? $budget->is_active,
            ]);

            if (isset($data['category_limits'])) {
                $budget->categoryLimits()->delete();

                foreach ($data['category_limits'] as $categoryLimit) {
                    BudgetCategory::create([
                        'budget_id' => $budget->id,
                        'category_id' => $categoryLimit['category_id'],
                        'limit' => $categoryLimit['limit'],
                    ]);
                }
            }

            $this->notifications->info($user, 'Orçamento atualizado', 'O orçamento foi atualizado com sucesso.');
        });

        return $this->success($budget->load('categoryLimits.category:id,name,color,icon'));
    }

    public function destroy(Request $request, Budget $budget): JsonResponse
    {
        $this->authorize('delete', $budget);

        $user = $request->user();

        DB::transaction(function () use ($budget, $user) {
            $budget->delete();

            $this->notifications->info($user, 'Orçamento removido', 'O orçamento foi removido com sucesso.');
        });

        return $this->success(['message' => 'Orçamento removido com sucesso.']);
    }

    public function getOrCreateCurrent(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Budget::class);

        $user = $request->user();
        $currentMonth = now()->format('Y-m');

        $budget = Budget::forUser($user->id)
            ->forMonth($currentMonth)
            ->with(['categoryLimits.category:id,name,color,icon'])
            ->first();

        if (!$budget) {
            $monthlyIncome = \App\Models\Income::forUser($user->id)
                ->where('is_active', true)
                ->sum('amount');

            $defaultLimit = $monthlyIncome > 0 ? $monthlyIncome * 0.8 : 5000;

            $budget = Budget::create([
                'monthly_limit' => $defaultLimit,
                'month_year' => $currentMonth,
                'is_active' => true,
                'user_id' => $user->id,
            ]);
        }

        $totalSpent = $budget->getCurrentSpending();
        $categorySpending = $budget->getCategorySpending();

        $budgetData = $budget->toArray();
        $budgetData['total_spent'] = $totalSpent;
        $budgetData['remaining'] = max(0, $budget->monthly_limit - $totalSpent);
        $budgetData['percentage'] = $budget->monthly_limit > 0 
            ? min(100, ($totalSpent / $budget->monthly_limit) * 100) 
            : 0;

        if (isset($budgetData['category_limits'])) {
            foreach ($budgetData['category_limits'] as &$categoryLimit) {
                $categoryId = $categoryLimit['category_id'];
                $spent = $categorySpending[$categoryId]['total'] ?? 0;
                
                $categoryLimit['spent'] = $spent;
                $categoryLimit['remaining'] = max(0, $categoryLimit['limit'] - $spent);
                $categoryLimit['percentage'] = $categoryLimit['limit'] > 0 
                    ? min(100, ($spent / $categoryLimit['limit']) * 100) 
                    : 0;
            }
        }

        return $this->success($budgetData);
    }
}

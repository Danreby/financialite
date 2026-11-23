<?php

namespace App\Http\Controllers;

use App\Actions\Budget\CreateBudget;
use App\Actions\Budget\DeleteBudget;
use App\Actions\Budget\GetOrCreateCurrentBudget;
use App\Actions\Budget\UpdateBudget;
use App\Http\Requests\Budget\BudgetStoreRequest;
use App\Http\Requests\Budget\BudgetUpdateRequest;
use App\Models\Budget;
use App\Queries\BudgetSummaryQuery;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    private const LIMITS = 'categoryLimits.category:id,name,color,icon';

    public function __construct(private NotificationService $notifications)
    {
        $this->middleware('auth');
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Budget::class);

        $budgets = Budget::forUser($request->user()->id)
            ->with([self::LIMITS])
            ->orderBy('month_year', 'desc')
            ->get();

        return $this->success($budgets);
    }

    public function current(Request $request, BudgetSummaryQuery $summary): JsonResponse
    {
        $this->authorize('viewAny', Budget::class);

        return $this->success($summary->current($request->user()));
    }

    /**
     * Mês já com orçamento lança DomainException, que segue como 500 (comportamento antigo).
     */
    public function store(BudgetStoreRequest $request, CreateBudget $createBudget): JsonResponse
    {
        $this->authorize('create', Budget::class);

        $user = $request->user();
        $budget = $createBudget->handle($user, $request->validated());

        $this->notifications->success($user, 'Orçamento criado', 'Novo orçamento mensal foi criado com sucesso.');

        return $this->success($budget->load(self::LIMITS), 201);
    }

    public function update(BudgetUpdateRequest $request, int $budget, UpdateBudget $updateBudget): JsonResponse
    {
        $user = $request->user();
        $updated = $updateBudget->handle($user, $budget, $request->validated());

        $this->notifications->info($user, 'Orçamento atualizado', 'O orçamento foi atualizado com sucesso.');

        return $this->success($updated->load(self::LIMITS));
    }

    public function destroy(Request $request, int $budget, DeleteBudget $deleteBudget): JsonResponse
    {
        $user = $request->user();
        $deleteBudget->handle($user, $budget);

        $this->notifications->info($user, 'Orçamento removido', 'O orçamento foi removido com sucesso.');

        return $this->success(['message' => 'Orçamento removido com sucesso.']);
    }

    public function getOrCreateCurrent(Request $request, GetOrCreateCurrentBudget $getOrCreate, BudgetSummaryQuery $summary): JsonResponse
    {
        $this->authorize('viewAny', Budget::class);

        return $this->success($summary->summarize($getOrCreate->handle($request->user())));
    }
}

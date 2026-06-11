<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Category;
use App\Services\DashboardInsightsService;
use App\Services\FaturaDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardApiController extends Controller
{
    public function __construct(
        private FaturaDashboardService $dashboardService,
        private DashboardInsightsService $insightsService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $bankUserId = $request->input('bank_user_id');
        $categoryId = $request->input('category_id');
        $page = $request->input('page', 1);

        if ($request->filled('bank_user_id')) {
            CardUser::forUser($user->id)->findOrFail($bankUserId);
        }

        $filters = ['bank_user_id' => $bankUserId, 'category_id' => $categoryId];
        $dashboard = $this->dashboardService->buildDashboardData($user, $filters);
        $transactions = $dashboard['base_query']->paginate(15, ['*'], 'page', $page);
        $stats = $this->dashboardService->buildStats($user, $bankUserId, $categoryId, $request->has('bank_user_id'));
        $insights = $this->insightsService->getInsights($user, $bankUserId);

        $bankAccounts = CardUser::with('card')->forUser($user->id)->get()->map(fn ($cu) => [
            'id' => $cu->id,
            'name' => $cu->card?->name ?? ('Cartão #'.$cu->id),
            'due_day' => $cu->due_day,
            'closing_day' => $cu->closing_day,
            'credit_limit' => $cu->credit_limit,
            'brand' => $cu->card?->brand,
        ]);

        $categories = Category::forUser($user->id)->orderBy('name')->get(['id', 'name', 'icon', 'color', 'type']);

        $bankAccountsList = BankUser::with('bank')->forUser($user->id)->orderBy('created_at')->get()->map(fn ($bu) => [
            'id' => $bu->id,
            'name' => $bu->bank?->name ?? ('Banco #'.$bu->id),
            'balance' => (float) $bu->balance,
        ]);

        return $this->success([
            'transactions' => $transactions,
            'stats' => $stats,
            'insights' => $insights,
            'bankAccounts' => $bankAccounts,
            'categories' => $categories,
            'bankAccountsList' => $bankAccountsList,
        ]);
    }
}

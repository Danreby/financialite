<?php

namespace App\Http\Controllers;

use App\Models\Transacao;
use App\Models\CardUser;
use App\Services\FaturaDashboardService;
use App\Services\DashboardInsightsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private FaturaDashboardService $dashboardService,
        private DashboardInsightsService $insightsService,
    ) {
        $this->middleware('auth');
    }

    public function data(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Transacao::class);

        $user = $request->user();
        $bankUserId = $request->input('bank_user_id');
        $categoryId = $request->input('category_id');
        $page = $request->input('page', 1);

        if ($request->filled('bank_user_id')) {
            $selectedBankUser = CardUser::forUser($user->id)->findOrFail($bankUserId);
            $this->authorize('view', $selectedBankUser);
        }

        $filters = [
            'bank_user_id' => $bankUserId,
            'category_id' => $categoryId,
        ];

        $dashboard = $this->dashboardService->buildDashboardData($user, $filters);

        $transactions = $dashboard['base_query']->paginate(15, ['*'], 'page', $page);

        $stats = $this->dashboardService->buildStats(
            $user,
            $bankUserId,
            $categoryId,
            $request->has('bank_user_id')
        );

        $insights = $this->insightsService->getInsights($user, $bankUserId);

        return $this->success([
            'transactions' => $transactions,
            'stats' => $stats,
            'insights' => $insights,
        ]);
    }
}

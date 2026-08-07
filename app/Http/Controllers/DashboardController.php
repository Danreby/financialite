<?php

namespace App\Http\Controllers;

use App\Contracts\Services\PrevisaoMensalServiceInterface;
use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Category;
use App\Models\Transacao;
use App\Services\DashboardInsightsService;
use App\Services\FaturaDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class DashboardController extends Controller
{
    public function __construct(
        private FaturaDashboardService $dashboardService,
        private DashboardInsightsService $insightsService,
        private PrevisaoMensalServiceInterface $previsaoService,
    ) {
        $this->middleware('auth');
    }

    public function home(): RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return redirect()->route('login');
    }

    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();

        $bankAccounts = CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(function ($cardUser) {
                return [
                    'id' => $cardUser->id,
                    'name' => $cardUser->card?->name ?? ('Cartão #'.$cardUser->id),
                    'due_day' => $cardUser->due_day,
                    'closing_day' => $cardUser->closing_day,
                    'credit_limit' => $cardUser->credit_limit,
                    'brand' => $cardUser->card?->brand,
                ];
            });

        $categories = Category::forUser($user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color', 'type']);

        $bankAccountsList = BankUser::with('bank')
            ->forUser($user->id)
            ->orderBy('created_at')
            ->get()
            ->map(fn ($bu) => [
                'id' => $bu->id,
                'name' => $bu->bank?->name ?? ('Banco #'.$bu->id),
                'balance' => (float) $bu->balance,
            ]);

        return Inertia::render('Dashboard', [
            'bankAccounts' => $bankAccounts,
            'categories' => $categories,
            'bankAccountsList' => $bankAccountsList,
        ]);
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

        $stats['current_month_bills_total'] = $this->previsaoService
            ->getBillsTotalForMonth($user->id, $stats['current_month_key'] ?? null)['total'];

        $insights = $this->insightsService->getInsights($user, $bankUserId);

        return $this->success([
            'transactions' => $transactions,
            'stats' => $stats,
            'insights' => $insights,
        ]);
    }
}

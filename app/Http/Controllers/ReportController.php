<?php

namespace App\Http\Controllers;

use App\Models\Transacao;
use App\Models\CardUser;
use App\Models\Category;
use App\Models\Income;
use App\Services\FaturaDashboardService;
use App\Services\FaturaExportService;
use App\Services\IncomeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ReportController extends Controller
{
    public function __construct(
        private FaturaDashboardService $dashboardService,
        private FaturaExportService $exportService,
    ) {
        $this->middleware('auth');
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
                    'name' => $cardUser->card?->name ?? ('Cartão #' . $cardUser->id),
                ];
            });

        $categories = Category::forUser($user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color']);

        $incomeService = app(IncomeService::class);
        $totalMonthlyIncome = $incomeService->totalMonthlyIncome($user->id);
        $incomes = $incomeService->listRecurringForUser($user->id)
            ->map(fn ($income) => [
                'id'         => $income->id,
                'title'      => $income->title,
                'amount'     => (float) $income->amount,
                'type'       => $income->type,
                'type_label' => $income->type_label,
                'is_active'  => $income->is_active,
                'bank_name'  => optional($income->bankUser?->card)->name,
            ]);

        return Inertia::render('Relatorio', [
            'bankAccounts'       => $bankAccounts,
            'categories'         => $categories,
            'incomes'            => $incomes,
            'totalMonthlyIncome' => $totalMonthlyIncome,
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Transacao::class);

        $user = $request->user();
        $bankUserId = $request->input('bank_user_id');
        $categoryId = $request->input('category_id');

        if ($request->filled('bank_user_id')) {
            $selectedBankUser = CardUser::forUser($user->id)->findOrFail($bankUserId);
            $this->authorize('view', $selectedBankUser);
        }

        $stats = $this->dashboardService->buildStats(
            $user,
            $bankUserId,
            $categoryId,
            $request->has('bank_user_id')
        );

        $exportData = $this->exportService->exportForUser($user->id, $bankUserId, $categoryId);

        // One-time income entries (entradas avulsas) grouped for the reports page
        $oneTimeIncomes = Income::forUser($user->id)
            ->where('is_recurring', false)
            ->where('is_active', true)
            ->whereNotNull('received_at')
            ->orderByDesc('received_at')
            ->get()
            ->map(fn (Income $income) => [
                'id'          => $income->id,
                'title'       => $income->title,
                'description' => $income->description,
                'amount'      => (float) $income->amount,
                'type'        => $income->type,
                'type_label'  => Income::TYPE_LABELS[$income->type] ?? $income->type,
                'received_at' => $income->received_at?->toDateString(),
                'month_key'   => $income->received_at?->format('Y-m'),
            ]);

        return $this->success([
            'stats'            => $stats,
            'export_data'      => $exportData,
            'one_time_incomes' => $oneTimeIncomes->values(),
        ]);
    }
}

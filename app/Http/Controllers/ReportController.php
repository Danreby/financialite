<?php

namespace App\Http\Controllers;

use App\Models\Transacao;
use App\Models\CardUser;
use App\Services\FaturaDashboardService;
use App\Services\FaturaExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        private FaturaDashboardService $dashboardService,
        private FaturaExportService $exportService,
    ) {
        $this->middleware('auth');
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

        return $this->success([
            'stats' => $stats,
            'export_data' => $exportData,
        ]);
    }
}

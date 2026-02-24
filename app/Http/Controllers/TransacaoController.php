<?php

namespace App\Http\Controllers;

use App\Models\Transacao;
use App\Models\CardUser;
use App\Services\FaturaService;
use App\Services\FaturaExportService;
use App\Services\FaturaImportService;
use App\Services\FaturaDashboardService;
use App\Services\FaturaPaymentService;
use App\Services\NotificationService;
use App\Services\DashboardInsightsService;
use App\Http\Requests\Fatura\FaturaStoreRequest;
use App\Http\Requests\Fatura\FaturaUpdateRequest;
use App\Http\Requests\Fatura\PayMonthRequest;
use App\Http\Requests\Fatura\FaturaImportRequest;
use App\Http\Requests\Dashboard\PeriodSpendingRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use DomainException;

class TransacaoController extends Controller
{
    public function __construct(
        private FaturaService $faturaService,
        private FaturaExportService $exportService,
        private FaturaImportService $importService,
        private FaturaDashboardService $dashboardService,
        private FaturaPaymentService $paymentService,
        private NotificationService $notifications,
        private DashboardInsightsService $insights
    )
    {
        $this->middleware('auth');
    }

    public function exportData(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Transacao::class);

        $user = $request->user();
        $bankUserId = $request->input('bank_user_id');
        $categoryId = $request->input('category_id');

        if ($request->filled('bank_user_id')) {
            CardUser::forUser($user->id)->findOrFail($bankUserId);
        }

        $faturas = $this->exportService->exportForUser($user->id, $bankUserId, $categoryId);

        return $this->success($faturas);
    }

    public function import(FaturaImportRequest $request): JsonResponse
    {
        $this->authorize('create', Transacao::class);

        $user = $request->user();

        $rows = $request->validated()['rows'] ?? [];

        try {
            $importedCount = $this->importService->importRows($user, $rows);

            return $this->success([
                'message' => 'Importação concluída.',
                'imported_count' => $importedCount,
            ]);
        } catch (DomainException $e) {
            $this->notifications->error($user, 'Erro na importação de faturas', $e->getMessage());

            return $this->error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            $this->notifications->error($user, 'Erro ao importar faturas', 'Ocorreu um erro inesperado ao importar faturas.');

            return $this->serverError('Erro ao importar faturas.');
        }
    }

    public function index(Request $request): JsonResponse|Response
    {
        $this->authorize('viewAny', Transacao::class);

        $user = $request->user();
        $bankUserId = $request->input('bank_user_id');
        $categoryId = $request->input('category_id');
        $selectedBankUser = null;

        if ($request->filled('bank_user_id')) {
            $selectedBankUser = CardUser::forUser($user->id)->findOrFail($bankUserId);
        }

        $filters = [
            'bank_user_id' => $bankUserId,
            'category_id' => $categoryId,
        ];

        $dashboard = $this->dashboardService->buildDashboardData($user, $filters);

        if ($request->wantsJson()) {
            $paginated = $dashboard['base_query']->paginate(15);
            return $this->success($paginated);
        }

        return Inertia::render('Fatura', [
            'monthlyGroups' => $dashboard['monthly_groups'],
            'bankAccounts' => $dashboard['bank_accounts'],
            'currentMonthKey' => $dashboard['current_month_key'],
            'filters' => [
                'bank_user_id' => $request->input('bank_user_id'),
                'category_id' => $request->input('category_id'),
            ],
            'categories' => $dashboard['categories'],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $fatura = Transacao::with(['bankUser.card', 'user', 'anexos'])->findOrFail($id);

        $this->authorize('view', $fatura);

        return $this->success($fatura);
    }

    public function store(FaturaStoreRequest $request): JsonResponse
    {
        $this->authorize('create', Transacao::class);

        $user = $request->user();
        $data = $this->normalizeInsertData($request->validated());

        if (!empty($data['bank_user_id'])) {
            $cardUser = CardUser::with('card')
                ->forUser($user->id)
                ->findOrFail($data['bank_user_id']);
            
            $this->authorize('view', $cardUser);
        }

        try {
            $fatura = $this->faturaService->createForUser($user, $data);
            $fatura->load(['bankUser.card', 'user']);
            return $this->success($fatura, 201);
        } catch (\Throwable $e) {
            report($e);
            $this->notifications->error($user, 'Erro ao criar fatura', 'Ocorreu um erro inesperado ao criar uma fatura.');

            return $this->serverError('Erro ao criar fatura');
        }
    }

    public function update(FaturaUpdateRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $fatura = Transacao::findOrFail($id);

        $this->authorize('update', $fatura);

        $data = $this->normalizeInsertData($request->validated());

        if (array_key_exists('bank_user_id', $data) && !empty($data['bank_user_id'])) {
            $cardUser = CardUser::forUser($user->id)->findOrFail($data['bank_user_id']);
            $this->authorize('view', $cardUser);
        }

        try {
            $fatura = $this->faturaService->updateForUser($fatura, $data);
            $fatura->load(['bankUser.card', 'user']);
            return $this->success($fatura);
        } catch (\Throwable $e) {
            report($e);
            $this->notifications->error($user, 'Erro ao atualizar fatura', 'Ocorreu um erro inesperado ao atualizar uma fatura.');

            return $this->serverError('Erro ao atualizar fatura');
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $fatura = Transacao::findOrFail($id);

        $this->authorize('delete', $fatura);

        $fatura->delete();
        return $this->success(['message' => 'Fatura removida.']);
    }

    public function restore(Request $request, int $id): JsonResponse
    {
        $fatura = Transacao::withTrashed()->findOrFail($id);

        $this->authorize('restore', $fatura);

        if ($fatura->trashed()) {
            $fatura->restore();
            return $this->success(['message' => 'Fatura restaurada.', 'fatura' => $fatura]);
        }

        return $this->error('Fatura não está removida.', 400);
    }

    public function payMonth(PayMonthRequest $request): JsonResponse
    {
        $this->authorize('update', Transacao::class);

        $user = $request->user();
        $data = $request->validated();
        $bankUserId = $data['bank_user_id'] ?? null;
        $bankUser = null;

        if ($bankUserId) {
            $bankUser = CardUser::forUser($user->id)->findOrFail($bankUserId);
            $this->authorize('view', $bankUser);
        }

        try {
            $totalPaidThisRun = $this->paymentService->payMonthForUser($user, $data['month'], $bankUser ?? null);

            if ($totalPaidThisRun <= 0) {
                return $this->success(['message' => 'Nenhuma fatura pendente para este mês.']);
            }

            $this->notifications->info($user, 'Pagamentos do mês', 'Pagamentos registrados com sucesso para o mês selecionado.');

            return $this->success([
                'message' => 'Pagamentos registrados com sucesso.',
            ]);
        } catch (\Throwable $e) {
            report($e);
            $this->notifications->error($user, 'Erro ao registrar pagamentos', 'Ocorreu um erro inesperado ao registrar os pagamentos do mês.');

            return $this->serverError('Erro ao registrar pagamentos do mês.');
        }
    }

    public function stats(Request $request): JsonResponse
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

        return $this->success($stats);
    }

    public function getInsights(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Transacao::class);

        $user = $request->user();
        $bankUserId = $request->input('bank_user_id');
        
        if ($request->filled('bank_user_id')) {
            $selectedBankUser = CardUser::forUser($user->id)->findOrFail($bankUserId);
            $this->authorize('view', $selectedBankUser);
        }

        $insights = $this->insights->getInsights($user, $bankUserId);

        return $this->success($insights);
    }

    public function topSpendingByPeriod(PeriodSpendingRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Transacao::class);

        $user = $request->user();
        $validated = $request->validated();

        $bankUserId = $validated['bank_user_id'] ?? null;
        $categoryId = $validated['category_id'] ?? null;

        if ($bankUserId) {
            $selectedBankUser = CardUser::forUser($user->id)->findOrFail($bankUserId);
            $this->authorize('view', $selectedBankUser);
        }

        $data = $this->dashboardService->getTopSpendingByPeriod(
            $user,
            $validated['month_from'],
            $validated['month_to'],
            $bankUserId,
            $categoryId,
        );

        return $this->success($data);
    }
}

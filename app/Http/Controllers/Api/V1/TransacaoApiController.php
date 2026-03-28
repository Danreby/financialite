<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Fatura\FaturaStoreRequest;
use App\Http\Requests\Fatura\FaturaUpdateRequest;
use App\Http\Requests\Fatura\PayMonthRequest;
use App\Http\Requests\Dashboard\PeriodSpendingRequest;
use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Transacao;
use App\Services\FaturaService;
use App\Services\FaturaDashboardService;
use App\Services\FaturaPaymentService;
use App\Services\FaturaExportService;
use App\Services\DashboardInsightsService;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransacaoApiController extends Controller
{
    public function __construct(
        private FaturaService $faturaService,
        private FaturaDashboardService $dashboardService,
        private FaturaPaymentService $paymentService,
        private FaturaExportService $exportService,
        private DashboardInsightsService $insights,
        private NotificationService $notifications,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $bankUserId = $request->input('bank_user_id');
        $categoryId = $request->input('category_id');

        if ($request->filled('bank_user_id')) {
            CardUser::forUser($user->id)->findOrFail($bankUserId);
        }

        $filters = [
            'bank_user_id' => $bankUserId,
            'category_id' => $categoryId,
            'type' => $request->input('type'),
            'month' => $request->input('month'),
            'status' => $request->input('status'),
        ];
        $dashboard = $this->dashboardService->buildDashboardData($user, $filters);
        $transactions = $dashboard['base_query']->paginate($request->input('per_page', 15));

        return $this->success($transactions);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $transacao = Transacao::with(['bankUser.card', 'category', 'anexos', 'parcelas'])->findOrFail($id);
        $this->authorize('view', $transacao);

        return $this->success($transacao);
    }

    public function store(FaturaStoreRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $this->normalizeInsertData($request->validated());

        if (!empty($data['bank_user_id'])) {
            $cardUser = CardUser::with('card')->forUser($user->id)->findOrFail($data['bank_user_id']);
        }

        try {
            $transacao = $this->faturaService->createForUser($user, $data);
            $transacao->load(['bankUser.card', 'category']);
            return $this->success($transacao, 201);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao criar transação.');
        }
    }

    public function update(FaturaUpdateRequest $request, int $id): JsonResponse
    {
        $user = $request->user();
        $transacao = Transacao::findOrFail($id);
        $this->authorize('update', $transacao);
        $data = $this->normalizeInsertData($request->validated());

        if (array_key_exists('bank_user_id', $data) && !empty($data['bank_user_id'])) {
            CardUser::forUser($user->id)->findOrFail($data['bank_user_id']);
        }

        try {
            $transacao = $this->faturaService->updateForUser($transacao, $data);
            $transacao->load(['bankUser.card', 'category']);
            return $this->success($transacao);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao atualizar transação.');
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $transacao = Transacao::findOrFail($id);
        $this->authorize('delete', $transacao);
        $transacao->delete();

        return $this->success(['message' => 'Transação removida.']);
    }

    public function restore(Request $request, int $id): JsonResponse
    {
        $transacao = Transacao::withTrashed()->findOrFail($id);
        $this->authorize('restore', $transacao);

        if ($transacao->trashed()) {
            $transacao->restore();
            return $this->success(['message' => 'Transação restaurada.', 'transacao' => $transacao]);
        }

        return $this->error('Transação não está removida.', 400);
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $bankUserId = $request->input('bank_user_id');
        $categoryId = $request->input('category_id');

        if ($request->filled('bank_user_id')) {
            CardUser::forUser($user->id)->findOrFail($bankUserId);
        }

        $stats = $this->dashboardService->buildStats($user, $bankUserId, $categoryId, $request->has('bank_user_id'));
        return $this->success($stats);
    }

    public function insights(Request $request): JsonResponse
    {
        $user = $request->user();
        $bankUserId = $request->input('bank_user_id');

        if ($request->filled('bank_user_id')) {
            CardUser::forUser($user->id)->findOrFail($bankUserId);
        }

        $insights = $this->insights->getInsights($user, $bankUserId);
        return $this->success($insights);
    }

    public function topSpending(PeriodSpendingRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $bankUserId = $validated['bank_user_id'] ?? null;
        $categoryId = $validated['category_id'] ?? null;

        if ($bankUserId) {
            CardUser::forUser($user->id)->findOrFail($bankUserId);
        }

        $data = $this->dashboardService->getTopSpendingByPeriod(
            $user,
            $validated['month_from'],
            $validated['month_to'],
            $bankUserId,
            $categoryId
        );

        return $this->success($data);
    }

    public function payMonth(PayMonthRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();
        $bankUserId = $data['bank_user_id'] ?? null;
        $bankUser = null;

        if ($bankUserId) {
            $bankUser = CardUser::forUser($user->id)->findOrFail($bankUserId);
        }

        $bankAccount = null;
        if (!empty($data['bank_account_id'])) {
            $bankAccount = BankUser::forUser($user->id)->findOrFail($data['bank_account_id']);
        }

        try {
            $totalPaidThisRun = $this->paymentService->payMonthForUser($user, $data['month'], $bankUser, $bankAccount);

            if ($totalPaidThisRun <= 0) {
                return $this->success(['message' => 'Nenhuma transação pendente para este mês.']);
            }

            return $this->success(['message' => 'Pagamentos registrados com sucesso.', 'total_paid' => $totalPaidThisRun]);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao registrar pagamentos do mês.');
        }
    }

    public function export(Request $request): JsonResponse
    {
        $user = $request->user();
        $bankUserId = $request->input('bank_user_id');
        $categoryId = $request->input('category_id');

        if ($request->filled('bank_user_id')) {
            CardUser::forUser($user->id)->findOrFail($bankUserId);
        }

        $data = $this->exportService->exportForUser($user->id, $bankUserId, $categoryId);
        return $this->success($data);
    }
}

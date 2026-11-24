<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Transacao\CreateTransacao;
use App\Actions\Transacao\DeleteTransacao;
use App\Actions\Transacao\PayFaturaMonth;
use App\Actions\Transacao\RestoreTransacao;
use App\Actions\Transacao\UpdateTransacao;
use App\Enums\TransacaoType;
use App\Exceptions\InsufficientBalanceException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\PeriodSpendingRequest;
use App\Http\Requests\Fatura\FaturaStoreRequest;
use App\Http\Requests\Fatura\FaturaUpdateRequest;
use App\Http\Requests\Fatura\PayMonthRequest;
use App\Models\CardUser;
use App\Models\Transacao;
use App\Services\DashboardInsightsService;
use App\Services\FaturaDashboardService;
use App\Services\FaturaExportService;
use DomainException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransacaoApiController extends Controller
{
    public function __construct(
        private FaturaDashboardService $dashboardService,
        private FaturaExportService $exportService,
        private DashboardInsightsService $insights,
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

    public function faturas(Request $request): JsonResponse
    {
        $user = $request->user();
        $month = $request->input('month');
        $bankUserId = $request->input('bank_user_id');
        $categoryId = $request->input('category_id');

        if ($request->filled('bank_user_id')) {
            CardUser::forUser($user->id)->findOrFail($bankUserId);
        }

        $filters = [
            'bank_user_id' => $bankUserId,
            'category_id' => $categoryId,
            'type' => TransacaoType::Credit->value,
        ];

        $dashboard = $this->dashboardService->buildDashboardData($user, $filters);
        $monthlyGroups = $dashboard['monthly_groups'] ?? [];

        // If a month is specified, return only that month's data
        if ($month) {
            $monthData = collect($monthlyGroups)->firstWhere('month_key', $month);

            return $this->success($monthData ?? [
                'month_key' => $month,
                'month_label' => $month,
                'total_spent' => 0,
                'total_paid' => 0,
                'is_paid' => false,
                'is_partially_paid' => false,
                'has_remaining_post_payment' => false,
                'items' => [],
            ]);
        }

        return $this->success($monthlyGroups);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $transacao = Transacao::with(['bankUser.card', 'category', 'anexos', 'parcelas'])
            ->forUser($request->user()->id)
            ->findOrFail($id);

        return $this->success($transacao);
    }

    public function store(FaturaStoreRequest $request, CreateTransacao $createTransacao): JsonResponse
    {
        try {
            $transacao = $createTransacao->handle($request->user(), $request->validated());
            $transacao->load(['bankUser.card', 'category']);

            return $this->success($transacao, 201);
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao criar transação.');
        }
    }

    public function update(FaturaUpdateRequest $request, int $id, UpdateTransacao $updateTransacao): JsonResponse
    {
        try {
            $transacao = $updateTransacao->handle($request->user(), $id, $request->validated());
            $transacao->load(['bankUser.card', 'category']);

            return $this->success($transacao);
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            return $this->serverError('Erro ao atualizar transação.');
        }
    }

    public function destroy(Request $request, int $id, DeleteTransacao $deleteTransacao): JsonResponse
    {
        $deleteTransacao->handle($request->user(), $id);

        return $this->success(['message' => 'Transação removida.']);
    }

    public function restore(Request $request, int $id, RestoreTransacao $restoreTransacao): JsonResponse
    {
        try {
            $transacao = $restoreTransacao->handle($request->user(), $id);
        } catch (DomainException) {
            return $this->error('Transação não está removida.', 400);
        }

        return $this->success(['message' => 'Transação restaurada.', 'transacao' => $transacao]);
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

    public function payMonth(PayMonthRequest $request, PayFaturaMonth $payFaturaMonth): JsonResponse
    {
        try {
            $totalPaidThisRun = $payFaturaMonth->handle($request->user(), $request->validated());

            if ($totalPaidThisRun <= 0) {
                return $this->success(['message' => 'Nenhuma transação pendente para este mês.']);
            }

            return $this->success(['message' => 'Pagamentos registrados com sucesso.', 'total_paid' => $totalPaidThisRun]);
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (InsufficientBalanceException $e) {
            return $this->error($e->getMessage(), 422);
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

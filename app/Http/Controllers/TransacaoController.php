<?php

namespace App\Http\Controllers;

use App\Actions\Transacao\CreateTransacao;
use App\Actions\Transacao\DeleteTransacao;
use App\Actions\Transacao\PayFaturaMonth;
use App\Actions\Transacao\PayFaturaPartial;
use App\Actions\Transacao\RestoreTransacao;
use App\Actions\Transacao\UpdateTransacao;
use App\Exceptions\InsufficientBalanceException;
use App\Http\Requests\Dashboard\PeriodSpendingRequest;
use App\Http\Requests\Fatura\FaturaImportRequest;
use App\Http\Requests\Fatura\FaturaStoreRequest;
use App\Http\Requests\Fatura\FaturaUpdateRequest;
use App\Http\Requests\Fatura\PayMonthRequest;
use App\Http\Requests\Fatura\PayPartialRequest;
use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Transacao;
use App\Queries\InstallmentsQuery;
use App\Queries\TransactionListQuery;
use App\Services\DashboardInsightsService;
use App\Services\FaturaDashboardService;
use App\Services\FaturaExportService;
use App\Services\FaturaImportService;
use App\Services\NotificationService;
use DomainException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransacaoController extends Controller
{
    public function __construct(
        private FaturaExportService $exportService,
        private FaturaImportService $importService,
        private FaturaDashboardService $dashboardService,
        private NotificationService $notifications,
        private DashboardInsightsService $insights
    ) {
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

        $debitAccounts = BankUser::with('bank')
            ->forUser($user->id)
            ->get()
            ->map(fn (BankUser $bu) => [
                'id' => $bu->id,
                'name' => $bu->bank?->name ?? ('Conta #'.$bu->id),
                'balance' => (float) $bu->balance,
            ]);

        return Inertia::render('Fatura', [
            'monthlyGroups' => $dashboard['monthly_groups'],
            'bankAccounts' => $dashboard['bank_accounts'],
            'debitAccounts' => $debitAccounts,
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
        $fatura = Transacao::with(['bankUser.card', 'user', 'anexos', 'parcelas'])
            ->forUser($request->user()->id)
            ->findOrFail($id);

        return $this->success($fatura);
    }

    public function store(FaturaStoreRequest $request, CreateTransacao $createTransacao): JsonResponse
    {
        $this->authorize('create', Transacao::class);

        $user = $request->user();

        try {
            $fatura = $createTransacao->handle($user, $request->validated());
            $fatura->load(['bankUser.card', 'user', 'parcelas']);

            return $this->success($fatura, 201);
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);
            $this->notifications->error($user, 'Erro ao criar fatura', 'Ocorreu um erro inesperado ao criar uma fatura.');

            return $this->serverError('Erro ao criar fatura');
        }
    }

    public function update(FaturaUpdateRequest $request, int $id, UpdateTransacao $updateTransacao): JsonResponse
    {
        $user = $request->user();

        try {
            $fatura = $updateTransacao->handle($user, $id, $request->validated());
            $fatura->load(['bankUser.card', 'user', 'parcelas']);

            return $this->success($fatura);
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (\Throwable $e) {
            report($e);
            $this->notifications->error($user, 'Erro ao atualizar fatura', 'Ocorreu um erro inesperado ao atualizar uma fatura.');

            return $this->serverError('Erro ao atualizar fatura');
        }
    }

    public function destroy(Request $request, int $id, DeleteTransacao $deleteTransacao): JsonResponse
    {
        $deleteTransacao->handle($request->user(), $id);

        return $this->success(['message' => 'Fatura removida.']);
    }

    public function restore(Request $request, int $id, RestoreTransacao $restoreTransacao): JsonResponse
    {
        try {
            $fatura = $restoreTransacao->handle($request->user(), $id);
        } catch (DomainException) {
            return $this->error('Fatura não está removida.', 400);
        }

        return $this->success(['message' => 'Fatura restaurada.', 'fatura' => $fatura]);
    }

    public function payMonth(PayMonthRequest $request, PayFaturaMonth $payFaturaMonth): JsonResponse
    {
        $this->authorize('update', Transacao::class);

        $user = $request->user();

        try {
            $totalPaidThisRun = $payFaturaMonth->handle($user, $request->validated());

            if ($totalPaidThisRun <= 0) {
                return $this->success(['message' => 'Nenhuma fatura pendente para este mês.']);
            }

            $this->notifications->info($user, 'Pagamentos do mês', 'Pagamentos registrados com sucesso para o mês selecionado.');

            return $this->success([
                'message' => 'Pagamentos registrados com sucesso.',
            ]);
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (InsufficientBalanceException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            report($e);
            $this->notifications->error($user, 'Erro ao registrar pagamentos', 'Ocorreu um erro inesperado ao registrar os pagamentos do mês.');

            return $this->serverError('Erro ao registrar pagamentos do mês.');
        }
    }

    public function payPartial(PayPartialRequest $request, PayFaturaPartial $payFaturaPartial): JsonResponse
    {
        $this->authorize('update', Transacao::class);

        $user = $request->user();
        $data = $request->validated();

        try {
            $result = $payFaturaPartial->handle($user, $data);

            $formattedAmount = number_format($result['amount_paid_now'], 2, ',', '.');
            $this->notifications->info(
                $user,
                'Pagamento parcial registrado',
                "Pagamento de R$ {$formattedAmount} registrado para {$data['month']}."
            );

            return $this->success([
                'message' => 'Pagamento parcial registrado com sucesso.',
                'total_paid' => $result['total_paid'],
                'total_due' => $result['total_due'],
                'amount_paid_now' => $result['amount_paid_now'],
                'is_fully_paid' => $result['is_fully_paid'],
            ]);
        } catch (ModelNotFoundException $e) {
            throw $e;
        } catch (DomainException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (\Throwable $e) {
            report($e);
            $this->notifications->error($user, 'Erro ao registrar pagamento', 'Ocorreu um erro ao registrar o pagamento parcial.');

            return $this->serverError('Erro ao registrar pagamento parcial.');
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

    public function transactionsList(Request $request, TransactionListQuery $query): Response
    {
        $this->authorize('viewAny', Transacao::class);

        return Inertia::render('Transacao', $query->get($request->user(), $request->query()));
    }

    public function installments(Request $request, InstallmentsQuery $query): Response
    {
        return Inertia::render('Parcelamentos', $query->get($request->user()));
    }
}

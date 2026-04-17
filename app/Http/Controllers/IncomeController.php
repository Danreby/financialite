<?php

namespace App\Http\Controllers;

use App\Contracts\Services\IncomeServiceInterface;
use App\Http\Requests\Income\IncomeStoreRequest;
use App\Http\Requests\Income\IncomeUpdateRequest;
use App\Models\Income;
use App\Models\CardUser;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncomeController extends Controller
{
    public function __construct(
        private IncomeServiceInterface $incomeService,
        private NotificationService $notifications
    ) {
        $this->middleware('auth');
    }

    protected function normalizeInsertData(array $data): array
    {
        $preserveCase = ['email', 'password', 'password_confirmation', 'title', 'description'];

        foreach ($data as $key => $value) {
            if (is_string($value) && !in_array($key, $preserveCase, true)) {
                $data[$key] = mb_strtolower(trim($value), 'UTF-8');
            }
        }

        return $data;
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Income::class);

        $incomes = $this->incomeService->listForUser($request->user()->id);

        return $this->success($incomes);
    }

    public function store(IncomeStoreRequest $request): JsonResponse
    {
        $this->authorize('create', Income::class);

        $user = $request->user();
        $data = $this->normalizeInsertData($request->validated());

        if (!empty($data['bank_user_id'])) {
            $bankUser = CardUser::forUser($user->id)->findOrFail($data['bank_user_id']);
            $this->authorize('view', $bankUser);
        }

        try {
            $income = $this->incomeService->createForUser($user, $data);
            $income->load('bankUser.card');

            $notificationTitle = $data['is_active'] ?? true
                ? 'Renda cadastrada'
                : 'Entrada avulsa registrada';

            $notificationMessage = $data['is_active'] ?? true
                ? "A renda \"{$income->title}\" foi adicionada."
                : "A entrada \"{$income->title}\" foi registrada.";

            $this->notifications->info($user, $notificationTitle, $notificationMessage);

            return $this->success($income, 201);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao cadastrar renda.');
        }
    }

    public function update(IncomeUpdateRequest $request, Income $income): JsonResponse
    {
        $this->authorize('update', $income);

        $user = $request->user();
        $data = $this->normalizeInsertData($request->validated());

        if (!empty($data['bank_user_id'])) {
            $bankUser = CardUser::forUser($user->id)->findOrFail($data['bank_user_id']);
            $this->authorize('view', $bankUser);
        }

        try {
            $income = $this->incomeService->updateForUser($income, $data);
            $income->load('bankUser.card');

            return $this->success($income);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao atualizar renda.');
        }
    }

    public function toggleActive(Request $request, Income $income): JsonResponse
    {
        $this->authorize('update', $income);

        try {
            $income = $this->incomeService->toggleActive($income);
            return $this->success($income);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao alterar status da renda.');
        }
    }

    public function destroy(Request $request, Income $income): JsonResponse
    {
        $this->authorize('delete', $income);

        $user = $request->user();

        try {
            $this->incomeService->deleteForUser($income);
            $this->notifications->info($user, 'Renda removida', 'Uma fonte de renda foi removida.');

            return $this->success(['message' => 'Renda removida.']);
        } catch (\Throwable $e) {
            report($e);
            return $this->serverError('Erro ao remover renda.');
        }
    }

    public function summary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Income::class);

        $totalMonthly = $this->incomeService->totalMonthlyIncome($request->user()->id);

        return $this->success([
            'total_monthly_income' => $totalMonthly,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Contracts\Services\IncomeServiceInterface;
use App\Contracts\Services\ResumoMensalServiceInterface;
use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Category;
use App\Models\Income;
use App\Models\Transacao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ResumoMensalController extends Controller
{
    public function __construct(
        private ResumoMensalServiceInterface $resumoService,
        private IncomeServiceInterface $incomeService,
    ) {
        $this->middleware('auth');
    }

    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();

        $bankAccounts = CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(fn ($cu) => [
                'id' => $cu->id,
                'name' => $cu->card?->name ?? ('Cartão #'.$cu->id),
            ]);

        $bankAccountsList = BankUser::with('bank')
            ->forUser($user->id)
            ->orderBy('created_at')
            ->get()
            ->map(fn ($bu) => [
                'id' => $bu->id,
                'name' => $bu->bank?->name ?? ('Banco #'.$bu->id),
                'balance' => (float) $bu->balance,
            ]);

        $categories = Category::forUser($user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color', 'type']);

        // Profile / Receitas tab: only recurring income sources.
        $incomes = $this->incomeService->listRecurringForUser($user->id)
            ->map(function (Income $income) {
                return [
                    'id' => $income->id,
                    'title' => $income->title,
                    'description' => $income->description,
                    'amount' => (float) $income->amount,
                    'type' => $income->type,
                    'type_label' => $income->type_label,
                    'payment_day_type' => $income->payment_day_type,
                    'payment_day_value' => $income->payment_day_value,
                    'payment_day_label' => $income->payment_day_label,
                    'is_active' => $income->is_active,
                    'is_recurring' => $income->is_recurring,
                    'received_at' => $income->received_at?->toDateString(),
                    'bank_user_id' => $income->bank_user_id,
                    'bank_account_id' => $income->bank_account_id,
                    'bank_name' => optional($income->bankUser?->card)->name,
                    'bank_account_name' => optional($income->bankAccount?->bank)->name,
                ];
            });

        $totalMonthly = $this->incomeService->totalMonthlyIncome($user->id);

        $incomesByType = $incomes->groupBy('type')->map(function ($items, $type) {
            return [
                'type' => $type,
                'label' => $items->first()['type_label'] ?? $type,
                'total' => $items->sum('amount'),
                'count' => $items->count(),
            ];
        })->values();

        return Inertia::render('ResumoMensal', [
            'bankAccounts' => $bankAccounts,
            'bankAccountsList' => $bankAccountsList,
            'categories' => $categories,
            'incomes' => $incomes->values(),
            'totalMonthly' => (float) $totalMonthly,
            'incomesByType' => $incomesByType,
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Transacao::class);

        $request->validate([
            'month_key' => ['nullable', 'string', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
        ]);

        $user = $request->user();
        $filters = $request->only(['month_key']);

        $result = $this->resumoService->buildResumoMensal($user, $filters);

        return $this->success($result);
    }
}

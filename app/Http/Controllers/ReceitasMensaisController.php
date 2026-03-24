<?php

namespace App\Http\Controllers;

use App\Contracts\Services\IncomeServiceInterface;
use App\Models\BankUser;
use App\Models\CardUser;
use App\Models\Income;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ReceitasMensaisController extends Controller
{
    public function __construct(
        private IncomeServiceInterface $incomeService,
    ) {
        $this->middleware('auth');
    }

    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();

        $incomes = $this->incomeService->listForUser($user->id)
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

        $bankAccounts = CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(fn ($cu) => [
                'id' => $cu->id,
                'name' => $cu->card?->name ?? ('Cartão #' . $cu->id),
            ]);

        $bankAccountsList = BankUser::with('bank')
            ->forUser($user->id)
            ->orderBy('created_at')
            ->get()
            ->map(fn ($bu) => [
                'id' => $bu->id,
                'name' => $bu->bank?->name ?? ('Banco #' . $bu->id),
                'balance' => (float) $bu->balance,
            ]);

        $totalMonthly = $this->incomeService->totalMonthlyIncome($user->id);

        $incomesByType = $incomes->groupBy('type')->map(function ($items, $type) {
            return [
                'type' => $type,
                'label' => $items->first()['type_label'] ?? $type,
                'total' => $items->sum('amount'),
                'count' => $items->count(),
            ];
        })->values();

        return Inertia::render('ReceitasMensais', [
            'incomes' => $incomes->values(),
            'bankAccounts' => $bankAccounts,
            'bankAccountsList' => $bankAccountsList,
            'totalMonthly' => (float) $totalMonthly,
            'incomesByType' => $incomesByType,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\NotificationService;
use App\Services\IncomeService;
use App\Contracts\Services\SavingsGoalServiceInterface;

class ProfileController extends Controller
{
    public function __construct(
        private NotificationService $notifications,
        private IncomeService $incomeService,
        private SavingsGoalServiceInterface $savingsService
    ) {
        $this->middleware('auth');
    }

    public function edit(Request $request): Response
    {
        $user = $request->user();

        $bankAccounts = \App\Models\CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(fn ($cu) => [
                'id'   => $cu->id,
                'name' => $cu->card?->name ?? ('Cartão #' . $cu->id),
            ]);

        $bankAccountsList = \App\Models\BankUser::with('bank')
            ->where('user_id', $user->id)
            ->get()
            ->map(fn ($bu) => [
                'id'      => $bu->id,
                'name'    => $bu->bank?->name ?? ('Banco #' . $bu->id),
                'balance' => (float) $bu->balance,
            ]);

        $incomes = $this->incomeService->listForUser($user->id)
            ->map(fn ($income) => [
                'id'                => $income->id,
                'title'             => $income->title,
                'description'       => $income->description,
                'amount'            => (float) $income->amount,
                'type'              => $income->type,
                'type_label'        => $income->type_label,
                'payment_day_type'  => $income->payment_day_type,
                'payment_day_value' => $income->payment_day_value,
                'payment_day_label' => $income->payment_day_label,
                'is_active'         => $income->is_active,
                'is_recurring'      => $income->is_recurring,
                'received_at'       => $income->received_at?->format('Y-m-d'),
                'bank_name'         => optional($income->bankUser?->card)->name,
                'bank_user_id'      => $income->bank_user_id,
                'bank_account_id'   => $income->bank_account_id,
                'bank_account_name' => optional($income->bankAccount?->bank)->name,
            ]);

        $totalMonthly = $this->incomeService->totalMonthlyIncome($user->id);

        $savingsGoals = $this->savingsService->listForUser($user->id)
            ->map(fn ($goal) => [
                'id'             => $goal->id,
                'title'          => $goal->title,
                'description'    => $goal->description,
                'target_amount'  => (float) $goal->target_amount,
                'current_amount' => (float) $goal->current_amount,
                'icon'           => $goal->icon,
                'color'          => $goal->color,
                'is_active'      => $goal->is_active,
                'progress'       => $goal->progress,
                'remaining'      => $goal->remaining,
                'is_completed'   => $goal->is_completed,
                'completed_at'   => $goal->completed_at?->toISOString(),
            ]);

        $savingsSummary = $this->savingsService->summaryForUser($user->id);

        $userStats = [
            'member_since'       => $user->created_at?->format('d/m/Y'),
            'banks_count'        => $user->bankUsers()->count(),
            'categories_count'   => $user->categories()->count(),
            'incomes_count'      => $user->incomes()->where('is_active', true)->count(),
            'transactions_count' => $user->transacoes()->count(),
            'savings_goals_count'=> $user->savingsGoals()->count(),
        ];

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail'    => $request->user() instanceof MustVerifyEmail,
            'status'             => session('status'),
            'bankAccounts'       => $bankAccounts,
            'bankAccountsList'   => $bankAccountsList,
            'incomes'            => $incomes,
            'totalMonthlyIncome' => $totalMonthly,
            'savingsGoals'       => $savingsGoals,
            'savingsSummary'     => $savingsSummary,
            'userStats'          => $userStats,
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        $this->notifications->info($request->user(), 'Perfil atualizado', 'Suas informações de perfil foram atualizadas.');

        return Redirect::route('profile.edit');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $this->notifications->warning($user, 'Conta excluída', 'Sua conta foi removida do Financialite.');

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}

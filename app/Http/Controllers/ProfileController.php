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

class ProfileController extends Controller
{
    public function __construct(
        private NotificationService $notifications,
        private IncomeService $incomeService
    ) {
        $this->middleware('auth');
    }

    public function edit(Request $request): Response
    {
        $user = $request->user();

        $bankAccounts = \App\Models\BankUser::with('bank')
            ->forUser($user->id)
            ->get()
            ->map(fn ($bu) => [
                'id'   => $bu->id,
                'name' => $bu->bank?->name ?? ('Conta #' . $bu->id),
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
                'bank_name'         => optional($income->bankUser?->bank)->name,
                'bank_user_id'      => $income->bank_user_id,
            ]);

        $totalMonthly = $this->incomeService->totalMonthlyIncome($user->id);

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail'    => $request->user() instanceof MustVerifyEmail,
            'status'             => session('status'),
            'bankAccounts'       => $bankAccounts,
            'incomes'            => $incomes,
            'totalMonthlyIncome' => $totalMonthly,
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

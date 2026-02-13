<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\BankController;
use App\Http\Controllers\TransacaoController;
use App\Http\Controllers\NotificationController;
use App\Models\BankUser;
use App\Models\Category;
use App\Models\Transacao;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    $user = request()->user();

    $bankAccounts = BankUser::with('bank')
        ->forUser($user->id)
        ->get()
        ->map(function ($bankUser) {
            return [
                'id' => $bankUser->id,
                'name' => $bankUser->bank?->name ?? ('Conta #' . $bankUser->id),
                'due_day' => $bankUser->due_day,
            ];
        });

    $categories = Category::forUser($user->id)
        ->orderBy('name')
        ->get(['id', 'name', 'icon', 'color']);

    return Inertia::render('Dashboard', [
        'bankAccounts' => $bankAccounts,
        'categories' => $categories,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/accounts', function () {
            $user = request()->user();

            $bankAccounts = BankUser::with('bank')
                ->forUser($user->id)
                ->orderBy('id')
                ->paginate(10, ['*'], 'accounts_page')
                ->through(function ($bankUser) {
                    return [
                        'id' => $bankUser->id,
                        'bank_id' => $bankUser->bank_id,
                        'name' => $bankUser->bank?->name ?? ('Conta #' . $bankUser->id),
                        'due_day' => $bankUser->due_day,
                    ];
                });

            $categories = Category::forUser($user->id)
                ->orderBy('name')
                ->paginate(5, ['id', 'name', 'icon', 'color'], 'categories_page');

            return Inertia::render('Conta', [
                'bankAccounts' => $bankAccounts,
                'categories' => $categories,
            ]);
    })->name('accounts.index');

    Route::get('/transactions', [\App\Http\Controllers\TransactionController::class, 'index'])
        ->name('transactions.index');

    Route::get('/reports', function () {
        $user = request()->user();

        $bankAccounts = BankUser::with('bank')
            ->forUser($user->id)
            ->get()
            ->map(function ($bankUser) {
                return [
                    'id' => $bankUser->id,
                    'name' => $bankUser->bank?->name ?? ('Conta #' . $bankUser->id),
                ];
            });

        $categories = Category::forUser($user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color']);

        $incomeService = app(\App\Services\IncomeService::class);
        $totalMonthlyIncome = $incomeService->totalMonthlyIncome($user->id);
        $incomes = $incomeService->listForUser($user->id)
            ->map(fn ($income) => [
                'id'         => $income->id,
                'title'      => $income->title,
                'amount'     => (float) $income->amount,
                'type'       => $income->type,
                'type_label' => $income->type_label,
                'is_active'  => $income->is_active,
                'bank_name'  => optional($income->bankUser?->bank)->name,
            ]);

        return Inertia::render('Relatorio', [
            'bankAccounts'       => $bankAccounts,
            'categories'         => $categories,
            'incomes'            => $incomes,
            'totalMonthlyIncome' => $totalMonthlyIncome,
        ]);
    })->name('reports.index');

    Route::get('/about', function () {
        return Inertia::render('About');
    })->name('about');

    Route::get('/settings', function () {
        $user = request()->user();
        return Inertia::render('Config', [
            'userTheme' => $user->theme ?? 'rose',
        ]);
    })->name('settings');

    Route::patch('/settings/theme', function () {
        $user = request()->user();
        $theme = request()->input('theme');

        $validThemes = ['rose', 'sunset', 'forest', 'gold', 'lavender', 'midnight'];
        if (!in_array($theme, $validThemes, true)) {
            return response()->json(['error' => 'Tema inválido.'], 422);
        }

        $user->update(['theme' => $theme]);

        return response()->json(['theme' => $theme]);
    })->name('settings.theme');

    Route::get('/banks/list', [BankController::class, 'list'])->name('banks.list');
    Route::post('/banks/attach', [BankController::class, 'attachToUser'])->name('banks.attach');
    Route::patch('/banks/user/{bankUser}/due-day', [BankController::class, 'updateDueDay'])
        ->name('banks.update-due-day');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])
        ->name('notifications.mark-as-read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])
        ->name('notifications.mark-all-as-read');
    Route::delete('/notifications', [NotificationController::class, 'clearAll'])
        ->name('notifications.clear-all');
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])
        ->name('notifications.unread-count');
});

require __DIR__.'/Fatura.php';

require __DIR__.'/Income.php';

require __DIR__.'/Anexo.php';

require __DIR__.'/SavingsGoal.php';

require __DIR__.'/auth.php';

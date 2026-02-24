<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\TransacaoController;
use App\Http\Controllers\NotificationController;
use App\Models\CardUser;
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

    $bankAccounts = CardUser::with('card')
        ->forUser($user->id)
        ->get()
        ->map(function ($cardUser) {
            return [
                'id' => $cardUser->id,
                'name' => $cardUser->card?->name ?? ('Cartão #' . $cardUser->id),
                'due_day' => $cardUser->due_day,
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

            $bankAccounts = CardUser::with('card')
                ->forUser($user->id)
                ->orderBy('id')
                ->paginate(10, ['*'], 'accounts_page')
                ->through(function ($cardUser) {
                    return [
                        'id' => $cardUser->id,
                        'card_id' => $cardUser->card_id,
                        'name' => $cardUser->card?->name ?? ('Cartão #' . $cardUser->id),
                        'due_day' => $cardUser->due_day,
                    ];
                });

            return Inertia::render('Cartoes', [
                'bankAccounts' => $bankAccounts,
            ]);
    })->name('accounts.index');

    Route::get('/categorias', function () {
        $user = request()->user();

        $categories = Category::forUser($user->id)
            ->orderBy('name')
            ->paginate(20, ['id', 'name', 'icon', 'color'], 'categories_page');

        return Inertia::render('Categorias', [
            'categories' => $categories,
        ]);
    })->name('categorias.index');

    Route::get('/parcelamentos', function () {
        $user = request()->user();

        $bankAccounts = CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(fn ($cu) => [
                'id'   => $cu->id,
                'name' => $cu->card?->name ?? ('Cartão #' . $cu->id),
            ]);

        $categories = Category::forUser($user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color']);

        $txs = Transacao::with(['bankUser.card', 'category'])
            ->where('user_id', $user->id)
            ->where('total_installments', '>', 1)
            ->orderByDesc('created_at')
            ->get();

        $installments = $txs->map(function ($tx) {
            $totalInstallments  = (int) ($tx->total_installments ?? 1);
            $currentInstallment = (int) ($tx->current_installment ?? 0);
            $remaining          = max($totalInstallments - $currentInstallment, 0);
            $amount             = (float) $tx->amount;
            $installmentAmount  = $totalInstallments > 0
                ? round($amount / $totalInstallments, 2)
                : $amount;

            $createdAt = \Carbon\Carbon::parse($tx->created_at);
            $dueDay    = $tx->bankUser?->due_day ?? 1;

            $firstBillingMonth = $createdAt->day <= $dueDay
                ? $createdAt->copy()->startOfMonth()
                : $createdAt->copy()->addMonth()->startOfMonth();

            $completionDate = $firstBillingMonth->copy()->addMonths($totalInstallments - 1);

            return [
                'id'                     => $tx->id,
                'title'                  => $tx->title,
                'description'            => $tx->description,
                'amount'                 => $amount,
                'installment_amount'     => $installmentAmount,
                'total_installments'     => $totalInstallments,
                'current_installment'    => $currentInstallment,
                'remaining_installments' => $remaining,
                'status'                 => $tx->status ?? 'unpaid',
                'created_at'             => $tx->created_at,
                'first_billing_month'    => $firstBillingMonth->format('Y-m'),
                'completion_month'       => $completionDate->format('Y-m'),
                'bank_user_id'           => $tx->bankUser?->id,
                'bank_name'              => $tx->bankUser?->card?->name,
                'category_id'            => $tx->category?->id,
                'category_name'          => $tx->category?->name,
                'category_icon'          => $tx->category?->icon,
                'category_color'         => $tx->category?->color,
                'type'                   => $tx->type ?? 'credit',
            ];
        });

        return Inertia::render('Parcelamentos', [
            'installments' => $installments,
            'bankAccounts' => $bankAccounts,
            'categories'   => $categories,
        ]);
    })->name('parcelamentos.index');

    Route::get('/transactions', [\App\Http\Controllers\TransactionController::class, 'index'])
        ->name('transactions.index');

    Route::get('/contas', function () {
        $user = request()->user();

        $bills = \App\Models\Bill::forUser($user->id)
            ->with(['category:id,name,color,icon'])
            ->orderBy('due_day')
            ->orderBy('created_at', 'desc')
            ->get();

        $categories = Category::forUser($user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'icon', 'color']);

        return Inertia::render('Contas', [
            'bills' => $bills,
            'categories' => $categories,
        ]);
    })->name('contas.index');

    Route::get('/reports', function () {
        $user = request()->user();

        $bankAccounts = CardUser::with('card')
            ->forUser($user->id)
            ->get()
            ->map(function ($cardUser) {
                return [
                    'id' => $cardUser->id,
                    'name' => $cardUser->card?->name ?? ('Cartão #' . $cardUser->id),
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
                'bank_name'  => optional($income->bankUser?->card)->name,
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

        $validThemes = ['rose', 'black', 'forest', 'gold', 'lavender', 'midnight'];
        if (!in_array($theme, $validThemes, true)) {
            return response()->json(['error' => 'Tema inválido.'], 422);
        }

        $user->update(['theme' => $theme]);

        return response()->json(['theme' => $theme]);
    })->name('settings.theme');

    Route::get('/cards/list', [CardController::class, 'list'])->name('cards.list');
    Route::post('/cards/attach', [CardController::class, 'attachToUser'])->name('cards.attach');
    Route::patch('/cards/user/{cardUser}/due-day', [CardController::class, 'updateDueDay'])
        ->name('cards.update-due-day');
    Route::delete('/cards/{card}', [CardController::class, 'destroy'])->name('cards.destroy');

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

require __DIR__.'/Bill.php';

require __DIR__.'/Budget.php';

require __DIR__.'/auth.php';

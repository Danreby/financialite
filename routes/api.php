<?php

use App\Http\Controllers\CardController;
use App\Http\Controllers\CardUserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardApiController;
use App\Http\Controllers\Api\V1\TransacaoApiController;
use App\Http\Controllers\Api\V1\IncomeApiController;
use App\Http\Controllers\Api\V1\BillApiController;
use App\Http\Controllers\Api\V1\BudgetApiController;
use App\Http\Controllers\Api\V1\SavingsGoalApiController;
use App\Http\Controllers\Api\V1\BankApiController;
use App\Http\Controllers\Api\V1\CategoryApiController;
use App\Http\Controllers\Api\V1\NotificationApiController;
use App\Http\Controllers\Api\V1\ProfileApiController;
use App\Http\Controllers\Api\V1\CardApiController;
use App\Http\Controllers\Api\V1\ProjectionsApiController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/google', [AuthController::class, 'googleLogin']);
});

Route::middleware(['auth:sanctum', 'throttle:api'])->prefix('v1')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/refresh-token', [AuthController::class, 'refreshToken']);

    Route::get('/dashboard', [DashboardApiController::class, 'index']);
    Route::get('/projections', [ProjectionsApiController::class, 'index']);

    Route::get('/transacoes', [TransacaoApiController::class, 'index']);
    Route::post('/transacoes', [TransacaoApiController::class, 'store']);
    Route::get('/transacoes/stats', [TransacaoApiController::class, 'stats']);
    Route::get('/transacoes/insights', [TransacaoApiController::class, 'insights']);
    Route::get('/transacoes/top-spending', [TransacaoApiController::class, 'topSpending']);
    Route::get('/transacoes/export', [TransacaoApiController::class, 'export']);
    Route::get('/transacoes/faturas', [TransacaoApiController::class, 'faturas']);
    Route::post('/transacoes/pay-month', [TransacaoApiController::class, 'payMonth']);
    Route::get('/transacoes/{id}', [TransacaoApiController::class, 'show']);
    Route::put('/transacoes/{id}', [TransacaoApiController::class, 'update']);
    Route::delete('/transacoes/{id}', [TransacaoApiController::class, 'destroy']);
    Route::post('/transacoes/{id}/restore', [TransacaoApiController::class, 'restore']);

    Route::get('/incomes', [IncomeApiController::class, 'index']);
    Route::post('/incomes', [IncomeApiController::class, 'store']);
    Route::get('/incomes/summary', [IncomeApiController::class, 'summary']);
    Route::put('/incomes/{income}', [IncomeApiController::class, 'update']);
    Route::delete('/incomes/{income}', [IncomeApiController::class, 'destroy']);
    Route::patch('/incomes/{income}/toggle', [IncomeApiController::class, 'toggleActive']);

    Route::get('/bills', [BillApiController::class, 'index']);
    Route::post('/bills', [BillApiController::class, 'store']);
    Route::get('/bills/upcoming', [BillApiController::class, 'upcoming']);
    Route::put('/bills/{bill}', [BillApiController::class, 'update']);
    Route::delete('/bills/{bill}', [BillApiController::class, 'destroy']);
    Route::post('/bills/{bill}/pay', [BillApiController::class, 'markAsPaid']);
    Route::patch('/bills/{bill}/toggle', [BillApiController::class, 'toggleStatus']);

    Route::get('/budgets', [BudgetApiController::class, 'index']);
    Route::post('/budgets', [BudgetApiController::class, 'store']);
    Route::get('/budgets/current', [BudgetApiController::class, 'current']);
    Route::post('/budgets/get-or-create-current', [BudgetApiController::class, 'getOrCreateCurrent']);
    Route::put('/budgets/{budget}', [BudgetApiController::class, 'update']);
    Route::delete('/budgets/{budget}', [BudgetApiController::class, 'destroy']);

    Route::get('/savings', [SavingsGoalApiController::class, 'index']);
    Route::post('/savings', [SavingsGoalApiController::class, 'store']);
    Route::get('/savings/summary', [SavingsGoalApiController::class, 'summary']);
    Route::put('/savings/{savingsGoal}', [SavingsGoalApiController::class, 'update']);
    Route::delete('/savings/{savingsGoal}', [SavingsGoalApiController::class, 'destroy']);
    Route::post('/savings/{savingsGoal}/deposit', [SavingsGoalApiController::class, 'deposit']);
    Route::post('/savings/{savingsGoal}/withdraw', [SavingsGoalApiController::class, 'withdraw']);

    Route::get('/bank-accounts', [BankApiController::class, 'index']);
    Route::post('/bank-accounts', [BankApiController::class, 'store']);
    Route::get('/bank-accounts/banks', [BankApiController::class, 'availableBanks']);
    Route::get('/bank-accounts/stats', [BankApiController::class, 'stats']);
    Route::get('/bank-accounts/{id}', [BankApiController::class, 'show']);
    Route::put('/bank-accounts/{id}', [BankApiController::class, 'update']);
    Route::delete('/bank-accounts/{id}', [BankApiController::class, 'destroy']);

    Route::get('/bank-transfers', [BankApiController::class, 'transfers']);
    Route::post('/bank-transfers', [BankApiController::class, 'transfer']);

    Route::get('/categories', [CategoryApiController::class, 'index']);
    Route::post('/categories', [CategoryApiController::class, 'store']);
    Route::put('/categories/{category}', [CategoryApiController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryApiController::class, 'destroy']);

    Route::get('/cards', [CardApiController::class, 'index']);
    Route::post('/cards', [CardApiController::class, 'store']);
    Route::get('/cards/available', [CardApiController::class, 'availableCards']);
    Route::put('/cards/{id}', [CardApiController::class, 'update']);
    Route::delete('/cards/{id}', [CardApiController::class, 'destroy']);

    Route::get('/notifications', [NotificationApiController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationApiController::class, 'unreadCount']);
    Route::patch('/notifications/{notification}/read', [NotificationApiController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationApiController::class, 'markAllAsRead']);
    Route::delete('/notifications/clear-all', [NotificationApiController::class, 'clearAll']);

    Route::get('/profile', [ProfileApiController::class, 'show']);
    Route::patch('/profile', [ProfileApiController::class, 'update']);
    Route::patch('/profile/theme', [ProfileApiController::class, 'updateTheme']);
    Route::patch('/profile/password', [ProfileApiController::class, 'updatePassword']);
    Route::delete('/profile', [ProfileApiController::class, 'destroy']);

    Route::apiResource('card-resources', CardController::class);
    Route::get('card-users/stats', [CardUserController::class, 'stats'])->name('api.card-users.stats');
    Route::apiResource('card-users', CardUserController::class);
});


// TEMPORARY DIAGNOSTIC ROUTE - remove after fixing production DB
Route::middleware(['auth:sanctum'])->get('v1/diagnose', function () {
    $tables = [
        'users', 'personal_access_tokens', 'cards', 'card_user', 'banks', 'bank_user',
        'transacoes', 'faturas', 'fatura_transacao', 'transacao_parcelas',
        'categories', 'incomes', 'bills', 'bill_payments', 'budgets',
        'budget_categories', 'savings_goals', 'bank_transfers', 'anexos',
        'anexo_transacao', 'notifications', 'cache', 'jobs',
    ];
    $result = [];
    foreach ($tables as $table) {
        $result[$table] = \Illuminate\Support\Facades\Schema::hasTable($table) ? 'OK' : 'MISSING';
    }
    return response()->json(['tables' => $result]);
});

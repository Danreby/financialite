<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\BankController;
use App\Http\Controllers\BillController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\TransacaoController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\ProjecaoController;
use Illuminate\Support\Facades\Route;

Route::get('/', [DashboardController::class, 'home']);

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/dashboard/data', [DashboardController::class, 'data'])
        ->middleware('cache.api:15')
        ->name('dashboard.data');

    Route::get('/reports/data', [ReportController::class, 'data'])
        ->middleware('cache.api:15')
        ->name('reports.data');

    Route::get('/accounts', [CardController::class, 'accounts'])->name('accounts.index');
    Route::get('/categorias', [CategoryController::class, 'page'])->name('categorias.index');
    Route::get('/parcelamentos', [TransacaoController::class, 'installments'])->name('parcelamentos.index');
    Route::get('/transactions', [TransacaoController::class, 'transactionsList'])->name('transactions.index');
    Route::get('/contas', [BillController::class, 'page'])->name('contas.index');
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/projecao', [ProjecaoController::class, 'index'])->name('projecao.index');
    Route::get('/bancos', [BankController::class, 'page'])->name('bancos.index');
    Route::get('/about', [SettingsController::class, 'about'])->name('about');
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
    Route::patch('/settings/theme', [SettingsController::class, 'updateTheme'])->name('settings.theme');

    Route::get('/cards/list', [CardController::class, 'list'])
        ->middleware('cache.api:30')
        ->name('cards.list');
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
        ->middleware('cache.api:10')
        ->name('notifications.unread-count');
});

require __DIR__.'/Fatura.php';
require __DIR__.'/Income.php';
require __DIR__.'/Anexo.php';
require __DIR__.'/SavingsGoal.php';
require __DIR__.'/Bill.php';
require __DIR__.'/Budget.php';
require __DIR__.'/Bank.php';
require __DIR__.'/ResumoMensal.php';
require __DIR__.'/auth.php';
<?php

use App\Http\Controllers\SavingsGoalController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('savings')->name('savings.')->group(function () {
        Route::get('/', [SavingsGoalController::class, 'index'])->name('index');
        Route::get('/summary', [SavingsGoalController::class, 'summary'])->name('summary');
        Route::post('/', [SavingsGoalController::class, 'store'])
            ->middleware('action.limit:create,30')
            ->name('store');
        Route::match(['put', 'patch'], '/{savingsGoal}', [SavingsGoalController::class, 'update'])
            ->middleware('action.limit:update,60')
            ->name('update');
        Route::post('/{savingsGoal}/deposit', [SavingsGoalController::class, 'deposit'])
            ->middleware('action.limit:update,60')
            ->name('deposit');
        Route::post('/{savingsGoal}/withdraw', [SavingsGoalController::class, 'withdraw'])
            ->middleware('action.limit:update,60')
            ->name('withdraw');
        Route::delete('/{savingsGoal}', [SavingsGoalController::class, 'destroy'])
            ->middleware('action.limit:delete,20')
            ->name('destroy');
    });
});

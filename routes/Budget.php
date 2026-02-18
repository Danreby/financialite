<?php

use App\Http\Controllers\BudgetController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'throttle:60,1'])->group(function () {
    Route::prefix('budgets')->name('budgets.')->group(function () {
        Route::get('/', [BudgetController::class, 'index'])->name('index');
        Route::get('/current', [BudgetController::class, 'current'])->name('current');
        Route::get('/get-or-create-current', [BudgetController::class, 'getOrCreateCurrent'])->name('getOrCreateCurrent');
        Route::post('/', [BudgetController::class, 'store'])->name('store');
        Route::put('/{budget}', [BudgetController::class, 'update'])->name('update');
        Route::delete('/{budget}', [BudgetController::class, 'destroy'])->name('destroy');
    });
});

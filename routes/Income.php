<?php

use App\Http\Controllers\IncomeController;
use App\Http\Controllers\ExtratoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // ── Income routes ──────────────────────────────────────
    Route::prefix('incomes')->name('incomes.')->group(function () {
        Route::get('/', [IncomeController::class, 'index'])->name('index');
        Route::get('/summary', [IncomeController::class, 'summary'])->name('summary');
        Route::post('/', [IncomeController::class, 'store'])
            ->middleware('action.limit:create,30')
            ->name('store');
        Route::match(['put', 'patch'], '/{income}', [IncomeController::class, 'update'])
            ->middleware('action.limit:update,60')
            ->name('update');
        Route::post('/{income}/toggle', [IncomeController::class, 'toggleActive'])
            ->middleware('action.limit:update,60')
            ->name('toggle');
        Route::delete('/{income}', [IncomeController::class, 'destroy'])
            ->middleware('action.limit:delete,20')
            ->name('destroy');
    });

    // ── Extrato routes ─────────────────────────────────────
    Route::prefix('extrato')->name('extrato.')->group(function () {
        Route::get('/', [ExtratoController::class, 'index'])->name('index');
        Route::get('/data', [ExtratoController::class, 'data'])->name('data');
    });
});

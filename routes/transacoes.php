<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\TransacaoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('transacoes')->name('transacoes.')->group(function () {
        Route::get('/', [TransacaoController::class, 'index'])->name('index');
        Route::get('/stats', [TransacaoController::class, 'stats'])
            ->middleware('cache.api:15')
            ->name('stats');
        Route::get('/insights', [TransacaoController::class, 'getInsights'])
            ->middleware(['action.limit:insights,30', 'cache.api:15'])
            ->name('insights');
        Route::get('/top-spending-by-period', [TransacaoController::class, 'topSpendingByPeriod'])
            ->middleware(['action.limit:top_spending_period,30', 'cache.api:15'])
            ->name('top_spending_by_period');
        Route::get('/export-data', [TransacaoController::class, 'exportData'])
            ->middleware('action.limit:export,10')
            ->name('export_data');
        Route::post('/import', [TransacaoController::class, 'import'])
            ->middleware('action.limit:import,5')
            ->name('import');
        Route::post('/pay-month', [TransacaoController::class, 'payMonth'])
            ->middleware('action.limit:pay_month,10')
            ->name('pay_month');
        Route::post('/pay-partial', [TransacaoController::class, 'payPartial'])
            ->middleware('action.limit:pay_partial,10')
            ->name('pay_partial');
        Route::post('/{id}/restore', [TransacaoController::class, 'restore'])
            ->middleware('action.limit:restore,20')
            ->name('restore');
        Route::get('/{id}', [TransacaoController::class, 'show'])->name('show');
        Route::post('/', [TransacaoController::class, 'store'])
            ->middleware('action.limit:create,30')
            ->name('store');
        Route::match(['put', 'patch'], '/{id}', [TransacaoController::class, 'update'])
            ->middleware('action.limit:update,60')
            ->name('update');
        Route::delete('/{id}', [TransacaoController::class, 'destroy'])
            ->middleware('action.limit:delete,20')
            ->name('destroy');
    });

    Route::prefix('categories')->name('categories.')->group(function () {
        Route::post('/', [CategoryController::class, 'store'])
            ->middleware('action.limit:create,30')
            ->name('store');
        Route::match(['put', 'patch'], '/{category}', [CategoryController::class, 'update'])
            ->middleware('action.limit:update,60')
            ->name('update');
        Route::delete('/{category}', [CategoryController::class, 'destroy'])
            ->middleware('action.limit:delete,20')
            ->name('destroy');
    });
});

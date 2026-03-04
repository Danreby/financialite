<?php

use App\Http\Controllers\BankController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('bank-accounts')->name('bank-accounts.')->group(function () {
        Route::get('/banks', [BankController::class, 'listBanks'])
            ->middleware('cache.api:60')
            ->name('list-banks');
        Route::get('/', [BankController::class, 'index'])
            ->middleware('cache.api:15')
            ->name('index');
        Route::get('/stats', [BankController::class, 'stats'])
            ->middleware('cache.api:15')
            ->name('stats');
        Route::post('/', [BankController::class, 'store'])
            ->middleware('action.limit:create,30')
            ->name('store');
        Route::get('/{bankUser}', [BankController::class, 'show'])
            ->middleware('cache.api:15')
            ->name('show');
        Route::match(['put', 'patch'], '/{bankUser}', [BankController::class, 'update'])
            ->middleware('action.limit:update,60')
            ->name('update');
        Route::delete('/{bankUser}', [BankController::class, 'destroy'])
            ->middleware('action.limit:delete,20')
            ->name('destroy');
    });

    Route::prefix('bank-transfers')->name('bank-transfers.')->group(function () {
        Route::get('/', [BankController::class, 'transfers'])
            ->middleware('cache.api:15')
            ->name('index');
        Route::post('/', [BankController::class, 'transfer'])
            ->middleware('action.limit:create,30')
            ->name('store');
    });
});

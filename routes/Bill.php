<?php

use App\Http\Controllers\BillController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'throttle:60,1'])->group(function () {
    Route::prefix('bills')->name('bills.')->group(function () {
        Route::get('/', [BillController::class, 'index'])
            ->middleware('cache.api:15')
            ->name('index');
        Route::post('/', [BillController::class, 'store'])->name('store');
        Route::get('/upcoming', [BillController::class, 'upcoming'])
            ->middleware('cache.api:15')
            ->name('upcoming');
        Route::put('/{bill}', [BillController::class, 'update'])->name('update');
        Route::delete('/{bill}', [BillController::class, 'destroy'])->name('destroy');
        Route::post('/{bill}/pay', [BillController::class, 'markAsPaid'])->name('pay');
        Route::patch('/{bill}/toggle', [BillController::class, 'toggleStatus'])->name('toggle');
    });
});

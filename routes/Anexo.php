<?php

use App\Http\Controllers\AnexoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('anexos')->name('anexos.')->group(function () {
        Route::get('/', [AnexoController::class, 'index'])->name('index');
        Route::get('/stats', [AnexoController::class, 'stats'])->name('stats');

        Route::post('/', [AnexoController::class, 'store'])
            ->middleware('action.limit:upload,20')
            ->name('store');

        Route::get('/{id}', [AnexoController::class, 'show'])->name('show');
        Route::get('/{id}/download', [AnexoController::class, 'download'])
            ->middleware('throttle:30,1')
            ->name('download');
        Route::get('/{id}/preview', [AnexoController::class, 'preview'])
            ->middleware('throttle:60,1')
            ->name('preview');
        Route::match(['put', 'patch'], '/{id}', [AnexoController::class, 'update'])
            ->middleware('action.limit:update,60')
            ->name('update');
        Route::delete('/{id}', [AnexoController::class, 'destroy'])
            ->middleware('action.limit:delete,20')
            ->name('destroy');

        Route::post('/attach', [AnexoController::class, 'attach'])
            ->middleware('action.limit:attach,30')
            ->name('attach');
        Route::delete('/{anexoId}/transacao/{transacaoId}', [AnexoController::class, 'detach'])
            ->middleware('action.limit:detach,30')
            ->name('detach');
    });

    Route::get('/transacoes/{transacaoId}/anexos', [AnexoController::class, 'listForTransacao'])
        ->name('transacoes.anexos');
});

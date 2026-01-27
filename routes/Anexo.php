<?php

use App\Http\Controllers\AnexoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('anexos')->name('anexos.')->group(function () {
        // Listagem e estatísticas
        Route::get('/', [AnexoController::class, 'index'])->name('index');
        Route::get('/stats', [AnexoController::class, 'stats'])->name('stats');

        // Upload
        Route::post('/', [AnexoController::class, 'store'])->name('store');

        // Operações por ID
        Route::get('/{id}', [AnexoController::class, 'show'])->name('show');
        Route::get('/{id}/download', [AnexoController::class, 'download'])->name('download');
        Route::get('/{id}/preview', [AnexoController::class, 'preview'])->name('preview');
        Route::match(['put', 'patch'], '/{id}', [AnexoController::class, 'update'])->name('update');
        Route::delete('/{id}', [AnexoController::class, 'destroy'])->name('destroy');

        // Associação com transações
        Route::post('/attach', [AnexoController::class, 'attach'])->name('attach');
        Route::delete('/{anexoId}/transacao/{transacaoId}', [AnexoController::class, 'detach'])->name('detach');
    });

    // Rota para listar anexos de uma transação específica
    Route::get('/transacoes/{transacaoId}/anexos', [AnexoController::class, 'listForTransacao'])
        ->name('transacoes.anexos');
});

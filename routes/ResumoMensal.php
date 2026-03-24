<?php

use App\Http\Controllers\ResumoMensalController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/resumo-mensal', [ResumoMensalController::class, 'index'])->name('resumo-mensal.index');
    Route::get('/resumo-mensal/data', [ResumoMensalController::class, 'data'])
        ->middleware('cache.api:15')
        ->name('resumo-mensal.data');
});

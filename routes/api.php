<?php

use App\Http\Controllers\BankController;
use App\Http\Controllers\BankUserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| As rotas de Transações e Categorias foram movidas para routes/Fatura.php
| para usar autenticação via sessão (web) ao invés de tokens Sanctum.
|
*/

Route::middleware(['auth:sanctum', 'throttle:api'])->prefix('v1')->group(function () {
    // Rotas de Bancos
    Route::apiResource('banks', BankController::class);

    // Stats route MUST come before apiResource to prevent route conflict
    Route::get('bank-users/stats', [BankUserController::class, 'stats'])->name('api.bank-users.stats');
    
    // Rotas de Associações Banco-Usuário
    Route::apiResource('bank-users', BankUserController::class);
});

// Backward compatibility - redirect old routes to v1
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::apiResource('banks', BankController::class);
    Route::get('bank-users/stats', [BankUserController::class, 'stats']);
    Route::apiResource('bank-users', BankUserController::class);
});

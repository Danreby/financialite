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

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    // Rotas de Bancos (apenas se necessário para API externa)
    Route::apiResource('banks', BankController::class);

    // Rotas de Associações Banco-Usuário (apenas se necessário para API externa)
    Route::apiResource('bank-users', BankUserController::class);
    Route::get('bank-users/stats', [BankUserController::class, 'stats'])->name('api.bank-users.stats');
});

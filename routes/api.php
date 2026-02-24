<?php

use App\Http\Controllers\CardController;
use App\Http\Controllers\CardUserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'throttle:api'])->prefix('v1')->group(function () {
    Route::apiResource('cards', CardController::class);

    Route::get('card-users/stats', [CardUserController::class, 'stats'])->name('api.card-users.stats');
    
    Route::apiResource('card-users', CardUserController::class);
});

Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::apiResource('cards', CardController::class);
    Route::get('card-users/stats', [CardUserController::class, 'stats']);
    Route::apiResource('card-users', CardUserController::class);
});

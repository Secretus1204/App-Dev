<?php

use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->name('auth.')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
        ->withoutMiddleware('throttle:api')
        ->middleware('throttle:password-reset')
        ->name('password.email');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])
        ->withoutMiddleware('throttle:api')
        ->middleware('throttle:password-reset')
        ->name('password.reset');
    Route::post('/login', [AuthController::class, 'login'])
        ->withoutMiddleware('throttle:api')
        ->middleware('throttle:login')
        ->name('login');

    Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
        Route::get('/me', [AuthController::class, 'me'])->name('me');
        Route::patch('/me', [AuthController::class, 'updateProfile'])->name('me.update');
        Route::put('/password', [AuthController::class, 'changePassword'])->name('password.update');
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    });
});

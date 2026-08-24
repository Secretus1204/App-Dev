<?php

use App\Http\Controllers\Api\V1\Admin\LoanController as AdminLoanController;
use App\Http\Controllers\Api\V1\LoanController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
    Route::middleware('role:user')->group(function (): void {
        Route::get('/loans', [LoanController::class, 'index'])->name('loans.index');
        Route::get('/loans/{loan}', [LoanController::class, 'show'])->name('loans.show');
    });

    Route::prefix('admin')->name('admin.')->middleware('role:admin')->group(function (): void {
        Route::get('/loans', [AdminLoanController::class, 'index'])->name('loans.index');
        Route::get('/loans/{loan}', [AdminLoanController::class, 'show'])->name('loans.show');
        Route::post('/loans/{loan}/return', [AdminLoanController::class, 'recordReturn'])->name('loans.return');
    });
});

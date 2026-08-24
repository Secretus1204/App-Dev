<?php

use App\Http\Controllers\Api\V1\Admin\BorrowRequestController as AdminBorrowRequestController;
use App\Http\Controllers\Api\V1\BorrowRequestController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
    Route::middleware('role:user')->group(function (): void {
        Route::get('/borrow-requests', [BorrowRequestController::class, 'index'])->name('borrow-requests.index');
        Route::post('/borrow-requests', [BorrowRequestController::class, 'store'])->name('borrow-requests.store');
        Route::get('/borrow-requests/{borrowRequest}', [BorrowRequestController::class, 'show'])->name('borrow-requests.show');
        Route::patch('/borrow-requests/{borrowRequest}/cancel', [BorrowRequestController::class, 'cancel'])
            ->name('borrow-requests.cancel');
    });

    Route::prefix('admin')->name('admin.')->middleware('role:admin')->group(function (): void {
        Route::get('/borrow-requests', [AdminBorrowRequestController::class, 'index'])
            ->name('borrow-requests.index');
        Route::get('/borrow-requests/{borrowRequest}', [AdminBorrowRequestController::class, 'show'])
            ->name('borrow-requests.show');
        Route::patch('/borrow-requests/{borrowRequest}/approve', [AdminBorrowRequestController::class, 'approve'])
            ->name('borrow-requests.approve');
        Route::patch('/borrow-requests/{borrowRequest}/reject', [AdminBorrowRequestController::class, 'reject'])
            ->name('borrow-requests.reject');
    });
});

<?php

use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\ReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')
    ->name('admin.')
    ->middleware(['auth:sanctum', 'active', 'role:admin'])
    ->group(function (): void {
        Route::get('/dashboard', [DashboardController::class, 'show'])->name('dashboard');
        Route::get('/reports/borrowings', [ReportController::class, 'borrowings'])->name('reports.borrowings');
        Route::get('/reports/borrowings/export', [ReportController::class, 'export'])->name('reports.borrowings.export');
    });

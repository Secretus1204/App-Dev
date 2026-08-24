<?php

use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'show'])->name('health');

Route::middleware(['auth:sanctum', 'active', 'role:admin'])->group(function (): void {
    Route::get('/admin/health', [HealthController::class, 'admin'])->name('admin.health');
});

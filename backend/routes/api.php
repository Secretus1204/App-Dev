<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\BorrowRequestController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Library Management System — API Routes
|--------------------------------------------------------------------------
|
| Public routes  : auth (register / login)
| Auth routes    : require Sanctum token (any authenticated user)
| Admin routes   : require Sanctum token + role:admin middleware
| User routes    : require Sanctum token + role:user middleware
|
*/

// ─── PUBLIC ───────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// Public read-only book & category listing (mobile catalog browsing before login)
Route::get('/books',            [BookController::class, 'index']);
Route::get('/books/{book}',     [BookController::class, 'show']);
Route::get('/categories',       [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);

// ─── AUTHENTICATED (any role) ─────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout',          [AuthController::class, 'logout']);
    Route::get('/auth/me',               [AuthController::class, 'me']);
    Route::post('/auth/profile',         [AuthController::class, 'updateProfile']);   // POST to handle multipart file upload
    Route::put('/auth/change-password',  [AuthController::class, 'changePassword']);

    // Notifications (both admin & user)
    Route::get('/notifications',                        [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count',           [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{notification}/read',   [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all',              [NotificationController::class, 'markAllRead']);

    // ─── ADMIN ONLY ───────────────────────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Book management
        Route::post('/books',         [BookController::class, 'store']);
        Route::post('/books/{book}',  [BookController::class, 'update']);   // POST for file upload compatibility
        Route::delete('/books/{book}', [BookController::class, 'destroy']);

        // Category management
        Route::post('/categories',              [CategoryController::class, 'store']);
        Route::put('/categories/{category}',    [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

        // Borrow request management
        Route::get('/borrow-requests',                          [BorrowRequestController::class, 'adminIndex']);
        Route::get('/borrow-requests/{borrowRequest}',          [BorrowRequestController::class, 'show']);
        Route::post('/borrow-requests/{borrowRequest}/approve', [BorrowRequestController::class, 'approve']);
        Route::post('/borrow-requests/{borrowRequest}/reject',  [BorrowRequestController::class, 'reject']);
        Route::post('/borrow-requests/{borrowRequest}/return',  [BorrowRequestController::class, 'markReturned']);
        Route::post('/borrow-requests/mark-overdue',            [BorrowRequestController::class, 'markOverdue']);

        // User management
        Route::get('/users',                        [UserController::class, 'index']);
        Route::get('/users/{user}',                 [UserController::class, 'show']);
        Route::put('/users/{user}/status',          [UserController::class, 'updateStatus']);

        // Reports
        Route::get('/reports', [ReportController::class, 'index']);
    });

    // ─── MOBILE USER ONLY ─────────────────────────────────────────────────────
    Route::middleware('role:user')->prefix('user')->group(function () {
        // My borrow requests (Pending / Borrowed / History tabs)
        Route::get('/borrow-requests',  [BorrowRequestController::class, 'userIndex']);
        Route::post('/borrow-requests', [BorrowRequestController::class, 'store']);
    });
});

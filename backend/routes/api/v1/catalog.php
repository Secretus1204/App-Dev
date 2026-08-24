<?php

use App\Http\Controllers\Api\V1\BookController;
use App\Http\Controllers\Api\V1\BookCopyController;
use App\Http\Controllers\Api\V1\CategoryController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
    Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('/books', [BookController::class, 'index'])->name('books.index');
    Route::get('/books/{book}', [BookController::class, 'show'])->name('books.show');

    Route::middleware('role:admin')->group(function (): void {
        Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::patch('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::patch('/categories/{category}/archive', [CategoryController::class, 'archive'])->name('categories.archive');

        Route::post('/books', [BookController::class, 'store'])->name('books.store');
        Route::match(['put', 'patch'], '/books/{book}', [BookController::class, 'update'])->name('books.update');
        Route::patch('/books/{book}/archive', [BookController::class, 'archive'])->name('books.archive');
        Route::post('/books/{book}/cover', [BookController::class, 'cover'])->name('books.cover');

        Route::get('/books/{book}/copies', [BookCopyController::class, 'index'])->name('book-copies.index');
        Route::post('/books/{book}/copies', [BookCopyController::class, 'store'])->name('book-copies.store');
        Route::patch('/book-copies/{copy}', [BookCopyController::class, 'update'])->name('book-copies.update');
        Route::patch('/book-copies/{copy}/archive', [BookCopyController::class, 'archive'])->name('book-copies.archive');
    });
});

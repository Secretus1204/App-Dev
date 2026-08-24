<?php

namespace App\Repositories\Contracts;

use App\Models\Book;
use App\Models\BorrowRequest;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface BorrowRequestRepositoryContract
{
    public function paginate(array $filters, ?User $owner = null): LengthAwarePaginator;

    public function loadForView(BorrowRequest $borrowRequest): BorrowRequest;

    public function lockForUpdate(BorrowRequest $borrowRequest): BorrowRequest;

    public function hasActiveRequest(User $user, Book $book): bool;

    public function create(User $user, Book $book): BorrowRequest;

    public function update(BorrowRequest $borrowRequest, array $attributes): BorrowRequest;
}

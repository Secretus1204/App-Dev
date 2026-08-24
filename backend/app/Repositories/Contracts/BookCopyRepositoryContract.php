<?php

namespace App\Repositories\Contracts;

use App\Models\Book;
use App\Models\BookCopy;
use Illuminate\Support\Collection;

interface BookCopyRepositoryContract
{
    public function listForBook(Book $book, ?string $status = null): Collection;

    public function create(Book $book, array $attributes): BookCopy;

    public function update(BookCopy $copy, array $attributes): BookCopy;
}

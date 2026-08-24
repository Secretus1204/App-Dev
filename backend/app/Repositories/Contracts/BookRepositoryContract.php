<?php

namespace App\Repositories\Contracts;

use App\Models\Book;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface BookRepositoryContract
{
    public function paginate(array $filters, bool $includeArchived): LengthAwarePaginator;

    public function loadForView(Book $book, bool $includeCopies = false): Book;

    public function create(array $attributes): Book;

    public function update(Book $book, array $attributes): Book;
}

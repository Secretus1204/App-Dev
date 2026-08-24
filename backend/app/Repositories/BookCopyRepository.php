<?php

namespace App\Repositories;

use App\Models\Book;
use App\Models\BookCopy;
use App\Repositories\Contracts\BookCopyRepositoryContract;
use Illuminate\Support\Collection;

class BookCopyRepository implements BookCopyRepositoryContract
{
    public function listForBook(Book $book, ?string $status = null): Collection
    {
        return $book->copies()
            ->when($status, fn ($query, string $value) => $query->where('status', $value))
            ->orderBy('accession_number')
            ->get();
    }

    public function create(Book $book, array $attributes): BookCopy
    {
        return $book->copies()->create($attributes);
    }

    public function update(BookCopy $copy, array $attributes): BookCopy
    {
        $copy->update($attributes);

        return $copy->refresh();
    }
}

<?php

namespace App\Repositories;

use App\Enums\BookCopyStatus;
use App\Models\Book;
use App\Repositories\Contracts\BookRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BookRepository implements BookRepositoryContract
{
    public function paginate(array $filters, bool $includeArchived): LengthAwarePaginator
    {
        $availableStatus = BookCopyStatus::Available->value;
        $archivedStatus = BookCopyStatus::Archived->value;

        $query = Book::query()
            ->with(['category' => fn ($query) => $query->withCount('books')])
            ->withCount([
                'copies as total_copies_count' => fn ($query) => $query->where('status', '!=', $archivedStatus),
                'copies as available_copies_count' => fn ($query) => $query->where('status', $availableStatus),
            ])
            ->when(! $includeArchived, function ($query): void {
                $query
                    ->where('is_active', true)
                    ->whereHas('category', fn ($category) => $category->where('is_active', true));
            })
            ->when($filters['category_id'] ?? null, fn ($query, int $id) => $query->where('category_id', $id))
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($nested) use ($search): void {
                    $nested
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('author', 'like', "%{$search}%")
                        ->orWhere('isbn', 'like', "%{$search}%");
                });
            });

        match ($filters['availability'] ?? null) {
            'available' => $query->whereHas('copies', fn ($copy) => $copy->where('status', $availableStatus)),
            'limited' => $query
                ->whereHas('copies', fn ($copy) => $copy->where('status', $availableStatus))
                ->whereHas('copies', fn ($copy) => $copy->whereNotIn('status', [$availableStatus, $archivedStatus])),
            'unavailable' => $query->whereDoesntHave('copies', fn ($copy) => $copy->where('status', $availableStatus)),
            default => null,
        };

        $sort = $filters['sort'] ?? 'title';
        $direction = $filters['direction'] ?? 'asc';

        return $query
            ->orderBy($sort, $direction)
            ->paginate($filters['per_page'] ?? 20)
            ->withQueryString();
    }

    public function loadForView(Book $book, bool $includeCopies = false): Book
    {
        $book->load(['category' => fn ($query) => $query->withCount('books')]);
        $book->loadCount([
            'copies as total_copies_count' => fn ($query) => $query->where('status', '!=', BookCopyStatus::Archived->value),
            'copies as available_copies_count' => fn ($query) => $query->where('status', BookCopyStatus::Available->value),
        ]);

        if ($includeCopies) {
            $book->load(['copies' => fn ($query) => $query->orderBy('accession_number')]);
        }

        return $book;
    }

    public function create(array $attributes): Book
    {
        return Book::query()->create($attributes);
    }

    public function update(Book $book, array $attributes): Book
    {
        $book->update($attributes);

        return $book->refresh();
    }
}

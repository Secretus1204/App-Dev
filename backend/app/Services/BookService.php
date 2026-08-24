<?php

namespace App\Services;

use App\Enums\BookCopyStatus;
use App\Models\Book;
use App\Models\User;
use App\Repositories\Contracts\BookCopyRepositoryContract;
use App\Repositories\Contracts\BookRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class BookService
{
    public function __construct(
        private readonly BookRepositoryContract $books,
        private readonly BookCopyRepositoryContract $copies,
        private readonly FileUploadService $files,
        private readonly AuditService $audit,
    ) {}

    public function paginate(array $filters, User $actor): LengthAwarePaginator
    {
        $includeArchived = $actor->isAdmin() && (bool) ($filters['include_archived'] ?? false);

        return $this->books->paginate($filters, $includeArchived);
    }

    public function show(Book $book, User $actor): Book
    {
        return $this->books->loadForView($book, $actor->isAdmin());
    }

    public function create(array $attributes, User $actor): Book
    {
        return DB::transaction(function () use ($attributes, $actor): Book {
            $copyCount = (int) ($attributes['initial_copies'] ?? 0);
            unset($attributes['initial_copies']);

            $book = $this->books->create($attributes);

            for ($index = 0; $index < $copyCount; $index++) {
                $this->copies->create($book, [
                    'accession_number' => $this->generateAccessionNumber($book),
                    'status' => BookCopyStatus::Available,
                ]);
            }

            $this->audit->record($actor, 'book.created', $book, after: $book->toArray());

            return $this->books->loadForView($book, includeCopies: true);
        });
    }

    public function update(Book $book, array $attributes, User $actor): Book
    {
        $before = $book->toArray();
        $book = $this->books->update($book, $attributes);
        $this->audit->record($actor, 'book.updated', $book, $before, $book->toArray());

        return $this->books->loadForView($book, includeCopies: true);
    }

    public function setActive(Book $book, bool $isActive, User $actor): Book
    {
        $before = $book->toArray();
        $book = $this->books->update($book, ['is_active' => $isActive]);
        $action = $isActive ? 'book.restored' : 'book.archived';
        $this->audit->record($actor, $action, $book, $before, $book->toArray());

        return $this->books->loadForView($book, includeCopies: true);
    }

    public function replaceCover(Book $book, UploadedFile $cover, User $actor): Book
    {
        $before = ['cover_path' => $book->cover_path];
        $newPath = $this->files->storePublicFile($cover, 'book-covers');

        try {
            $book = $this->books->update($book, ['cover_path' => $newPath]);
        } catch (Throwable $exception) {
            $this->files->deletePublicFile($newPath);
            throw $exception;
        }

        $this->files->deletePublicFile($before['cover_path']);
        $this->audit->record(
            $actor,
            'book.cover.updated',
            $book,
            $before,
            ['cover_path' => $newPath],
        );

        return $this->books->loadForView($book, includeCopies: true);
    }

    private function generateAccessionNumber(Book $book): string
    {
        return sprintf('LIB-%06d-%s', $book->id, Str::upper(Str::random(8)));
    }
}

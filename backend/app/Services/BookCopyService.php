<?php

namespace App\Services;

use App\Enums\BookCopyStatus;
use App\Exceptions\DomainConflictException;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\User;
use App\Repositories\Contracts\BookCopyRepositoryContract;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class BookCopyService
{
    public function __construct(
        private readonly BookCopyRepositoryContract $copies,
        private readonly AuditService $audit,
    ) {}

    public function list(Book $book, ?string $status = null): Collection
    {
        return $this->copies->listForBook($book, $status);
    }

    public function create(Book $book, array $attributes, User $actor): BookCopy
    {
        if (! $book->is_active) {
            throw new DomainConflictException('A copy cannot be added to an archived book.');
        }

        $attributes['accession_number'] ??= sprintf(
            'LIB-%06d-%s',
            $book->id,
            Str::upper(Str::random(8)),
        );
        $attributes['status'] = BookCopyStatus::Available;

        $copy = $this->copies->create($book, $attributes);
        $this->audit->record($actor, 'book_copy.created', $copy, after: $copy->toArray());

        return $copy;
    }

    public function update(BookCopy $copy, array $attributes, User $actor): BookCopy
    {
        $requestedStatus = $attributes['status'] ?? null;

        if ($copy->status === BookCopyStatus::Borrowed && $requestedStatus !== null) {
            throw new DomainConflictException(
                'A borrowed copy status can only be changed through the loan return workflow.'
            );
        }

        $before = $copy->toArray();
        $copy = $this->copies->update($copy, $attributes);
        $this->audit->record($actor, 'book_copy.updated', $copy, $before, $copy->toArray());

        return $copy;
    }

    public function setArchived(BookCopy $copy, bool $archived, User $actor): BookCopy
    {
        if ($copy->status === BookCopyStatus::Borrowed) {
            throw new DomainConflictException('A borrowed copy cannot be archived.');
        }

        if (! $archived && $copy->status !== BookCopyStatus::Archived) {
            return $copy;
        }

        $before = $copy->toArray();
        $copy = $this->copies->update($copy, [
            'status' => $archived ? BookCopyStatus::Archived : BookCopyStatus::Available,
        ]);
        $action = $archived ? 'book_copy.archived' : 'book_copy.restored';
        $this->audit->record($actor, $action, $copy, $before, $copy->toArray());

        return $copy;
    }
}

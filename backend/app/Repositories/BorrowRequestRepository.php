<?php

namespace App\Repositories;

use App\Enums\BookCopyStatus;
use App\Enums\BorrowRequestStatus;
use App\Models\Book;
use App\Models\BorrowRequest;
use App\Models\User;
use App\Repositories\Contracts\BorrowRequestRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BorrowRequestRepository implements BorrowRequestRepositoryContract
{
    public function paginate(array $filters, ?User $owner = null): LengthAwarePaginator
    {
        $query = BorrowRequest::query()
            ->with($this->relations())
            ->when($owner !== null, fn ($query) => $query->where('user_id', $owner->id))
            ->when($filters['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->when($filters['user_id'] ?? null, fn ($query, int $id) => $query->where('user_id', $id))
            ->when($filters['book_id'] ?? null, fn ($query, int $id) => $query->where('book_id', $id))
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($nested) use ($search): void {
                    $nested
                        ->whereHas('user', fn ($user) => $user
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('member_id', 'like', "%{$search}%"))
                        ->orWhereHas('book', fn ($book) => $book
                            ->where('title', 'like', "%{$search}%")
                            ->orWhere('author', 'like', "%{$search}%")
                            ->orWhere('isbn', 'like', "%{$search}%"));
                });
            });

        return $query
            ->orderBy($filters['sort'] ?? 'requested_at', $filters['direction'] ?? 'desc')
            ->paginate($filters['per_page'] ?? 20)
            ->withQueryString();
    }

    public function loadForView(BorrowRequest $borrowRequest): BorrowRequest
    {
        return $borrowRequest->load($this->relations());
    }

    public function lockForUpdate(BorrowRequest $borrowRequest): BorrowRequest
    {
        return BorrowRequest::query()->lockForUpdate()->findOrFail($borrowRequest->id);
    }

    public function hasActiveRequest(User $user, Book $book): bool
    {
        return BorrowRequest::query()
            ->where('user_id', $user->id)
            ->where('book_id', $book->id)
            ->where(function ($query): void {
                $query->where('status', BorrowRequestStatus::Pending->value)
                    ->orWhere(function ($approved): void {
                        $approved
                            ->where('status', BorrowRequestStatus::Approved->value)
                            ->whereDoesntHave('loan');
                    });
            })
            ->exists();
    }

    public function create(User $user, Book $book): BorrowRequest
    {
        return BorrowRequest::query()->create([
            'user_id' => $user->id,
            'book_id' => $book->id,
            'status' => BorrowRequestStatus::Pending,
            'requested_at' => now(),
        ]);
    }

    public function update(BorrowRequest $borrowRequest, array $attributes): BorrowRequest
    {
        $borrowRequest->update($attributes);

        return $borrowRequest->refresh();
    }

    private function relations(): array
    {
        return [
            'user:id,name,member_id,email,role,status',
            'reviewer:id,name,email',
            'loan' => fn ($query) => $query->with('bookCopy:id,book_id,accession_number,barcode,status'),
            'book' => fn ($query) => $query
                ->with('category:id,name,is_active')
                ->withCount([
                    'copies as total_copies_count' => fn ($copy) => $copy->where('status', '!=', BookCopyStatus::Archived->value),
                    'copies as available_copies_count' => fn ($copy) => $copy->where('status', BookCopyStatus::Available->value),
                ]),
        ];
    }
}

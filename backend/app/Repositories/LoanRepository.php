<?php

namespace App\Repositories;

use App\Models\Loan;
use App\Models\User;
use App\Repositories\Contracts\LoanRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class LoanRepository implements LoanRepositoryContract
{
    public function paginate(array $filters, ?User $owner = null): LengthAwarePaginator
    {
        $query = Loan::query()
            ->with($this->relations())
            ->when($owner !== null, fn ($query) => $query->where('user_id', $owner->id))
            ->when($filters['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->when($filters['user_id'] ?? null, fn ($query, int $id) => $query->where('user_id', $id))
            ->when($filters['book_id'] ?? null, fn ($query, int $id) => $query
                ->whereHas('bookCopy', fn ($copy) => $copy->where('book_id', $id)))
            ->when($filters['date_from'] ?? null, fn ($query, string $date) => $query->whereDate('borrowed_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn ($query, string $date) => $query->whereDate('borrowed_at', '<=', $date))
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($nested) use ($search): void {
                    $nested
                        ->whereHas('user', fn ($user) => $user
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('member_id', 'like', "%{$search}%"))
                        ->orWhereHas('bookCopy', fn ($copy) => $copy
                            ->where('accession_number', 'like', "%{$search}%")
                            ->orWhere('barcode', 'like', "%{$search}%")
                            ->orWhereHas('book', fn ($book) => $book
                                ->where('title', 'like', "%{$search}%")
                                ->orWhere('author', 'like', "%{$search}%")
                                ->orWhere('isbn', 'like', "%{$search}%")));
                });
            });

        return $query
            ->orderBy($filters['sort'] ?? 'borrowed_at', $filters['direction'] ?? 'desc')
            ->paginate($filters['per_page'] ?? 20)
            ->withQueryString();
    }

    public function loadForView(Loan $loan): Loan
    {
        return $loan->load($this->relations());
    }

    public function lockForUpdate(Loan $loan): Loan
    {
        return Loan::query()->lockForUpdate()->findOrFail($loan->id);
    }

    private function relations(): array
    {
        return [
            'user:id,name,member_id,email',
            'issuer:id,name',
            'receiver:id,name',
            'borrowRequest:id,user_id,book_id,status,requested_at',
            'bookCopy' => fn ($query) => $query
                ->select(['id', 'book_id', 'accession_number', 'barcode', 'status'])
                ->with(['book' => fn ($book) => $book
                    ->select(['id', 'category_id', 'isbn', 'title', 'author', 'cover_path'])
                    ->with('category:id,name')]),
        ];
    }
}

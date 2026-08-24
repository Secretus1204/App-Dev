<?php

namespace App\Services;

use App\Enums\BookCopyStatus;
use App\Enums\BorrowRequestStatus;
use App\Enums\LoanStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\BorrowRequest;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class OperationalReportService
{
    public function __construct(private readonly LoanService $loans) {}

    public function dashboard(): array
    {
        $this->loans->synchronizeOverdue();

        return [
            'summary' => [
                'total_books' => Book::query()->where('is_active', true)->count(),
                'available_copies' => BookCopy::query()->where('status', BookCopyStatus::Available->value)->count(),
                'borrowed_copies' => BookCopy::query()->where('status', BookCopyStatus::Borrowed->value)->count(),
                'pending_requests' => BorrowRequest::query()->where('status', BorrowRequestStatus::Pending->value)->count(),
                'overdue_loans' => Loan::query()->where('status', LoanStatus::Overdue->value)->count(),
                'active_members' => User::query()
                    ->where('role', UserRole::User->value)
                    ->where('status', UserStatus::Active->value)
                    ->count(),
            ],
            'monthly_activity' => $this->monthlyActivity(6),
            'popular_books' => $this->popularBooks(5),
            'recent_requests' => BorrowRequest::query()
                ->with([
                    'user:id,name,member_id,email,role,status',
                    'reviewer:id,name,email',
                    'loan.bookCopy',
                    'book' => fn ($book) => $book
                        ->with('category:id,name,is_active')
                        ->withCount([
                            'copies as total_copies_count' => fn ($copy) => $copy->where('status', '!=', BookCopyStatus::Archived->value),
                            'copies as available_copies_count' => fn ($copy) => $copy->where('status', BookCopyStatus::Available->value),
                        ]),
                ])
                ->latest('requested_at')
                ->limit(5)
                ->get(),
            'current_loans' => Loan::query()
                ->with($this->loanRelations())
                ->whereIn('status', [LoanStatus::Borrowed->value, LoanStatus::Overdue->value])
                ->orderBy('due_at')
                ->limit(5)
                ->get(),
        ];
    }

    public function report(array $filters): array
    {
        $this->loans->synchronizeOverdue();
        [$from, $to] = $this->range($filters);
        $range = [$from, $to];

        $mostActive = User::query()
            ->select(['users.id', 'users.name'])
            ->join('loans', 'loans.user_id', '=', 'users.id')
            ->whereBetween('loans.borrowed_at', $range)
            ->groupBy('users.id', 'users.name')
            ->selectRaw('COUNT(loans.id) as borrow_count')
            ->orderByDesc('borrow_count')
            ->first();

        return [
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'summary' => [
                'total_transactions' => Loan::query()->whereBetween('borrowed_at', $range)->count(),
                'total_returns' => Loan::query()->whereBetween('returned_at', $range)->count(),
                'overdue_count' => Loan::query()->where('status', LoanStatus::Overdue->value)->count(),
                'most_active_user' => $mostActive === null ? null : [
                    'id' => $mostActive->id,
                    'name' => $mostActive->name,
                    'borrow_count' => (int) $mostActive->borrow_count,
                ],
            ],
            'monthly_activity' => $this->monthlyActivity(6, $to),
            'category_distribution' => Loan::query()
                ->join('book_copies', 'book_copies.id', '=', 'loans.book_copy_id')
                ->join('books', 'books.id', '=', 'book_copies.book_id')
                ->join('categories', 'categories.id', '=', 'books.category_id')
                ->whereBetween('loans.borrowed_at', $range)
                ->groupBy('categories.id', 'categories.name')
                ->selectRaw('categories.name, COUNT(loans.id) as value')
                ->orderByDesc('value')
                ->get()
                ->map(fn ($row) => ['name' => $row->name, 'value' => (int) $row->value]),
            'popular_books' => $this->popularBooks(10, $range),
        ];
    }

    public function exportRows(array $filters): Collection
    {
        [$from, $to] = $this->range($filters);

        return Loan::query()
            ->with($this->loanRelations())
            ->whereBetween('borrowed_at', [$from, $to])
            ->orderByDesc('borrowed_at')
            ->get();
    }

    private function monthlyActivity(int $months, ?Carbon $endingAt = null): array
    {
        $endingAt ??= now();
        $result = [];

        for ($offset = $months - 1; $offset >= 0; $offset--) {
            $month = $endingAt->copy()->subMonthsNoOverflow($offset);
            $start = $month->copy()->startOfMonth();
            $end = $month->copy()->endOfMonth();
            $result[] = [
                'month' => $month->format('M'),
                'year' => $month->year,
                'borrowed' => Loan::query()->whereBetween('borrowed_at', [$start, $end])->count(),
                'returned' => Loan::query()->whereBetween('returned_at', [$start, $end])->count(),
            ];
        }

        return $result;
    }

    private function popularBooks(int $limit, ?array $range = null): Collection
    {
        return Book::query()
            ->select(['books.id', 'books.title', 'books.author', 'books.cover_path'])
            ->join('book_copies', 'book_copies.book_id', '=', 'books.id')
            ->join('loans', 'loans.book_copy_id', '=', 'book_copies.id')
            ->when($range !== null, fn ($query) => $query->whereBetween('loans.borrowed_at', $range))
            ->groupBy('books.id', 'books.title', 'books.author', 'books.cover_path')
            ->selectRaw('COUNT(loans.id) as borrow_count')
            ->orderByDesc('borrow_count')
            ->limit($limit)
            ->get()
            ->map(fn (Book $book) => [
                'id' => $book->id,
                'title' => $book->title,
                'author' => $book->author,
                'cover_url' => $book->cover_path === null ? null : Storage::disk('public')->url($book->cover_path),
                'borrow_count' => (int) $book->borrow_count,
            ]);
    }

    private function range(array $filters): array
    {
        $to = isset($filters['date_to']) ? Carbon::parse($filters['date_to'])->endOfDay() : now()->endOfDay();
        $from = isset($filters['date_from']) ? Carbon::parse($filters['date_from'])->startOfDay() : $to->copy()->subMonths(5)->startOfMonth();

        return [$from, $to];
    }

    private function loanRelations(): array
    {
        return [
            'user:id,name,member_id,email',
            'issuer:id,name',
            'receiver:id,name',
            'borrowRequest:id,user_id,book_id,status,requested_at',
            'bookCopy.book.category',
        ];
    }
}

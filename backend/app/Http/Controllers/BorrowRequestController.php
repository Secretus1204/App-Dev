<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\BorrowRequest;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Http\Request;

class BorrowRequestController extends Controller
{
    // ─── GET /api/admin/borrow-requests (admin: all requests with filters) ─────
    public function adminIndex(Request $request)
    {
        $query = BorrowRequest::with(['user', 'book.category']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('member_id', 'like', "%{$search}%");
            })->orWhereHas('book', function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(15));
    }

    // ─── GET /api/user/borrow-requests (mobile user: own requests) ────────────
    public function userIndex(Request $request)
    {
        $query = BorrowRequest::with(['book.category'])
            ->where('user_id', $request->user()->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    // ─── POST /api/user/borrow-requests (mobile user: request a book) ─────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'book_id' => 'required|exists:books,id',
        ]);

        $book = Book::findOrFail($data['book_id']);

        if ($book->available_quantity <= 0 || $book->status === 'unavailable') {
            return response()->json(['message' => 'This book is not currently available.'], 422);
        }

        // Check if user already has a pending/approved/borrowed request for this book
        $existing = BorrowRequest::where('user_id', $request->user()->id)
            ->where('book_id', $book->id)
            ->whereIn('status', ['pending', 'approved', 'borrowed'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You already have an active request for this book.'], 422);
        }

        $borrowRequest = BorrowRequest::create([
            'user_id'      => $request->user()->id,
            'book_id'      => $book->id,
            'status'       => 'pending',
            'request_date' => Carbon::today(),
        ]);

        $borrowRequest->load(['book.category', 'user']);

        return response()->json(['message' => 'Borrow request submitted.', 'request' => $borrowRequest], 201);
    }

    // ─── GET /api/admin/borrow-requests/{id} ──────────────────────────────────
    public function show(BorrowRequest $borrowRequest)
    {
        $borrowRequest->load(['user', 'book.category']);
        return response()->json($borrowRequest);
    }

    // ─── POST /api/admin/borrow-requests/{id}/approve ─────────────────────────
    public function approve(BorrowRequest $borrowRequest)
    {
        if ($borrowRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be approved.'], 422);
        }

        $book = $borrowRequest->book;

        if ($book->available_quantity <= 0) {
            return response()->json(['message' => 'No copies available.'], 422);
        }

        $borrowRequest->update([
            'status'      => 'approved',
            'borrow_date' => Carbon::today(),
            'due_date'    => Carbon::today()->addDays(14), // 2-week loan period
        ]);

        // Decrease available quantity
        $book->decrement('available_quantity');
        $this->syncBookStatus($book);

        // Notify user
        Notification::create([
            'user_id' => $borrowRequest->user_id,
            'title'   => 'Borrow Request Approved',
            'message' => "Your request to borrow \"{$book->title}\" has been approved. Please pick it up.",
            'type'    => 'approval',
        ]);

        return response()->json(['message' => 'Request approved.', 'request' => $borrowRequest]);
    }

    // ─── POST /api/admin/borrow-requests/{id}/reject ──────────────────────────
    public function reject(Request $request, BorrowRequest $borrowRequest)
    {
        if ($borrowRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be rejected.'], 422);
        }

        $data = $request->validate([
            'rejection_reason' => 'nullable|string',
        ]);

        $borrowRequest->update([
            'status'           => 'rejected',
            'rejection_reason' => $data['rejection_reason'] ?? null,
        ]);

        // Notify user
        Notification::create([
            'user_id' => $borrowRequest->user_id,
            'title'   => 'Borrow Request Rejected',
            'message' => "Your request to borrow \"{$borrowRequest->book->title}\" was not approved." .
                         ($data['rejection_reason'] ? " Reason: {$data['rejection_reason']}" : ''),
            'type'    => 'rejection',
        ]);

        return response()->json(['message' => 'Request rejected.', 'request' => $borrowRequest]);
    }

    // ─── POST /api/admin/borrow-requests/{id}/return ──────────────────────────
    public function markReturned(BorrowRequest $borrowRequest)
    {
        if (!in_array($borrowRequest->status, ['borrowed', 'approved', 'overdue'])) {
            return response()->json(['message' => 'This request cannot be marked as returned.'], 422);
        }

        $borrowRequest->update([
            'status'        => 'returned',
            'returned_date' => Carbon::today(),
        ]);

        // Restore available quantity
        $book = $borrowRequest->book;
        $book->increment('available_quantity');
        $this->syncBookStatus($book);

        // Notify user
        Notification::create([
            'user_id' => $borrowRequest->user_id,
            'title'   => 'Book Returned',
            'message' => "Thank you! \"{$book->title}\" has been returned successfully.",
            'type'    => 'return_confirmed',
        ]);

        return response()->json(['message' => 'Book marked as returned.', 'request' => $borrowRequest]);
    }

    // ─── POST /api/admin/borrow-requests/mark-overdue ─────────────────────────
    // Utility: auto-mark overdue (can be called from a scheduled command)
    public function markOverdue()
    {
        $overdueRequests = BorrowRequest::where('status', 'borrowed')
            ->where('due_date', '<', Carbon::today())
            ->get();

        foreach ($overdueRequests as $req) {
            $req->update(['status' => 'overdue']);

            Notification::create([
                'user_id' => $req->user_id,
                'title'   => 'Book Overdue',
                'message' => "Your borrowed book \"{$req->book->title}\" is overdue. Please return it immediately.",
                'type'    => 'overdue_warning',
            ]);
        }

        return response()->json(['message' => "{$overdueRequests->count()} requests marked as overdue."]);
    }

    // ─── Helper: sync book status based on available_quantity ─────────────────
    private function syncBookStatus(Book $book): void
    {
        $book->refresh();
        if ($book->available_quantity === 0) {
            $book->update(['status' => 'unavailable']);
        } elseif ($book->available_quantity <= 2) {
            $book->update(['status' => 'limited']);
        } else {
            $book->update(['status' => 'available']);
        }
    }
}

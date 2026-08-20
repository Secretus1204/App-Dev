<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\BorrowRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    // ─── GET /api/admin/dashboard ─────────────────────────────────────────────
    public function index()
    {
        $totalBooks    = Book::where('status', '!=', 'archived')->count();
        $totalMembers  = User::where('role', 'user')->count();
        $available     = Book::where('status', 'available')->count();
        $pending       = BorrowRequest::where('status', 'pending')->count();
        $overdue       = BorrowRequest::where('status', 'overdue')->count();
        $borrowed      = BorrowRequest::where('status', 'borrowed')->count();

        // Most active user (most total borrows)
        $mostActiveUser = User::where('role', 'user')
            ->withCount('borrowRequests')
            ->orderByDesc('borrow_requests_count')
            ->first(['id', 'name', 'member_id', 'avatar', 'borrow_requests_count']);

        // Recent borrow requests (last 5)
        $recentRequests = BorrowRequest::with(['user', 'book'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'total_books'   => $totalBooks,
                'total_members' => $totalMembers,
                'available'     => $available,
                'pending'       => $pending,
                'overdue'       => $overdue,
                'borrowed'      => $borrowed,
            ],
            'most_active_user' => $mostActiveUser,
            'recent_requests'  => $recentRequests,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\BorrowRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    // ─── GET /api/admin/reports ───────────────────────────────────────────────
    public function index(Request $request)
    {
        // Monthly borrowing activity (last 6 months)
        $monthlyActivity = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthlyActivity[] = [
                'month'   => $month->format('M Y'),
                'borrows' => BorrowRequest::whereYear('request_date', $month->year)
                    ->whereMonth('request_date', $month->month)
                    ->whereIn('status', ['borrowed', 'returned', 'overdue'])
                    ->count(),
                'returns' => BorrowRequest::whereYear('returned_date', $month->year)
                    ->whereMonth('returned_date', $month->month)
                    ->where('status', 'returned')
                    ->count(),
            ];
        }

        // Category distribution (books per category)
        $categoryDistribution = Book::with('category')
            ->selectRaw('category_id, COUNT(*) as total')
            ->groupBy('category_id')
            ->get()
            ->map(fn ($b) => [
                'category' => $b->category->name ?? 'Unknown',
                'total'    => $b->total,
            ]);

        // Most borrowed books (top 5)
        $mostBorrowed = BorrowRequest::with('book')
            ->selectRaw('book_id, COUNT(*) as borrow_count')
            ->groupBy('book_id')
            ->orderByDesc('borrow_count')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'book'         => $r->book->title ?? 'Unknown',
                'author'       => $r->book->author ?? '',
                'borrow_count' => $r->borrow_count,
            ]);

        return response()->json([
            'monthly_activity'      => $monthlyActivity,
            'category_distribution' => $categoryDistribution,
            'most_borrowed_books'   => $mostBorrowed,
        ]);
    }
}

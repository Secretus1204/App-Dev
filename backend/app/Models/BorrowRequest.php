<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BorrowRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'book_id',
        'status',
        'request_date',
        'borrow_date',
        'due_date',
        'returned_date',
        'rejection_reason',
    ];

    protected $casts = [
        'request_date'  => 'date',
        'borrow_date'   => 'date',
        'due_date'      => 'date',
        'returned_date' => 'date',
    ];

    // A borrow request belongs to a user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // A borrow request belongs to a book
    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    // Computed: days remaining until due date (negative = overdue)
    public function getDaysRemainingAttribute(): ?int
    {
        if (!$this->due_date) return null;
        return Carbon::today()->diffInDays($this->due_date, false);
    }

    // Computed: days overdue (positive number)
    public function getDaysOverdueAttribute(): int
    {
        if (!$this->due_date) return 0;
        $diff = Carbon::today()->diffInDays($this->due_date, false);
        return $diff < 0 ? abs($diff) : 0;
    }
}

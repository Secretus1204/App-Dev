<?php

namespace App\Models;

use App\Enums\BookCopyStatus;
use Database\Factories\BookCopyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookCopy extends Model
{
    /** @use HasFactory<BookCopyFactory> */
    use HasFactory;

    protected $fillable = [
        'book_id',
        'accession_number',
        'barcode',
        'status',
        'condition_notes',
    ];

    protected function casts(): array
    {
        return ['status' => BookCopyStatus::class];
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }
}

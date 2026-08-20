<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'isbn',
        'title',
        'author',
        'publisher',
        'publication_year',
        'category_id',
        'cover_image',
        'quantity',
        'available_quantity',
        'description',
        'status',
    ];

    // A book belongs to a category
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // A book has many borrow requests
    public function borrowRequests()
    {
        return $this->hasMany(BorrowRequest::class);
    }
}

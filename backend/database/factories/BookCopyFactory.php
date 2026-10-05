<?php

namespace Database\Factories;

use App\Enums\BookCopyStatus;
use App\Models\Book;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BookCopyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'book_id' => Book::factory(),
            'accession_number' => fake()->unique()->bothify('ACC-####-????'),
            'barcode' => fake()->unique()->ean13(),
            'qr_code' => 'RCJK-COPY-'.Str::upper((string) Str::ulid()),
            'status' => BookCopyStatus::Available,
            'condition_notes' => null,
        ];
    }
}

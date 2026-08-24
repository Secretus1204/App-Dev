<?php

namespace Database\Factories;

use App\Enums\BookCopyStatus;
use App\Models\Book;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookCopyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'book_id' => Book::factory(),
            'accession_number' => fake()->unique()->bothify('ACC-####-????'),
            'barcode' => fake()->unique()->ean13(),
            'status' => BookCopyStatus::Available,
            'condition_notes' => null,
        ];
    }
}

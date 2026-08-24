<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookFactory extends Factory
{
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'isbn' => fake()->unique()->isbn13(),
            'title' => fake()->sentence(4),
            'author' => fake()->name(),
            'publisher' => fake()->company(),
            'publication_year' => fake()->numberBetween(1950, (int) date('Y')),
            'description' => fake()->paragraph(),
            'cover_path' => null,
            'is_active' => true,
        ];
    }
}

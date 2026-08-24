<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class DefaultCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Fiction', 'description' => 'Novels, short stories, and literary works.'],
            ['name' => 'Non-Fiction', 'description' => 'Informational and factual works.'],
            ['name' => 'Science and Technology', 'description' => 'Science, computing, and technology resources.'],
            ['name' => 'History', 'description' => 'Historical studies and reference materials.'],
            ['name' => 'Education', 'description' => 'Teaching, learning, and academic resources.'],
        ];

        foreach ($categories as $category) {
            Category::query()->updateOrCreate(
                ['name' => $category['name']],
                [...$category, 'is_active' => true],
            );
        }
    }
}

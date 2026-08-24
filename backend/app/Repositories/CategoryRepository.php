<?php

namespace App\Repositories;

use App\Models\Category;
use App\Repositories\Contracts\CategoryRepositoryContract;
use Illuminate\Support\Collection;

class CategoryRepository implements CategoryRepositoryContract
{
    public function list(array $filters, bool $includeArchived): Collection
    {
        return Category::query()
            ->withCount('books')
            ->when(! $includeArchived, fn ($query) => $query->where('is_active', true))
            ->when(
                $filters['search'] ?? null,
                fn ($query, string $search) => $query->where('name', 'like', "%{$search}%")
            )
            ->orderBy('name')
            ->get();
    }

    public function create(array $attributes): Category
    {
        return Category::query()->create($attributes);
    }

    public function update(Category $category, array $attributes): Category
    {
        $category->update($attributes);

        return $category->refresh()->loadCount('books');
    }
}

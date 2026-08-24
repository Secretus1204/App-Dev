<?php

namespace App\Services;

use App\Models\Category;
use App\Models\User;
use App\Repositories\Contracts\CategoryRepositoryContract;
use Illuminate\Support\Collection;

class CategoryService
{
    public function __construct(
        private readonly CategoryRepositoryContract $categories,
        private readonly AuditService $audit,
    ) {}

    public function list(array $filters, User $actor): Collection
    {
        $includeArchived = $actor->isAdmin() && (bool) ($filters['include_archived'] ?? false);

        return $this->categories->list($filters, $includeArchived);
    }

    public function create(array $attributes, User $actor): Category
    {
        $category = $this->categories->create($attributes)->loadCount('books');
        $this->audit->record($actor, 'category.created', $category, after: $category->toArray());

        return $category;
    }

    public function update(Category $category, array $attributes, User $actor): Category
    {
        $before = $category->toArray();
        $category = $this->categories->update($category, $attributes);
        $this->audit->record($actor, 'category.updated', $category, $before, $category->toArray());

        return $category;
    }

    public function setActive(Category $category, bool $isActive, User $actor): Category
    {
        $before = $category->toArray();
        $category = $this->categories->update($category, ['is_active' => $isActive]);
        $action = $isActive ? 'category.restored' : 'category.archived';
        $this->audit->record($actor, $action, $category, $before, $category->toArray());

        return $category;
    }
}

<?php

namespace App\Repositories\Contracts;

use App\Models\Category;
use Illuminate\Support\Collection;

interface CategoryRepositoryContract
{
    public function list(array $filters, bool $includeArchived): Collection;

    public function create(array $attributes): Category;

    public function update(Category $category, array $attributes): Category;
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\ArchiveCategoryRequest;
use App\Http\Requests\Category\IndexCategoryRequest;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryService $categories,
    ) {}

    public function index(IndexCategoryRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Category::class);
        $categories = $this->categories->list($request->validated(), $request->user());

        return ApiResponse::success(
            CategoryResource::collection($categories)->resolve($request)
        );
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $this->authorize('create', Category::class);
        $category = $this->categories->create($request->validated(), $request->user());

        return ApiResponse::success(
            CategoryResource::make($category)->resolve($request),
            'Category created successfully.',
            201,
        );
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $this->authorize('update', $category);
        $category = $this->categories->update($category, $request->validated(), $request->user());

        return ApiResponse::success(
            CategoryResource::make($category)->resolve($request),
            'Category updated successfully.',
        );
    }

    public function archive(ArchiveCategoryRequest $request, Category $category): JsonResponse
    {
        $this->authorize('update', $category);
        $category = $this->categories->setActive(
            $category,
            $request->boolean('is_active'),
            $request->user(),
        );

        return ApiResponse::success(
            CategoryResource::make($category)->resolve($request),
            $category->is_active ? 'Category restored successfully.' : 'Category archived successfully.',
        );
    }
}

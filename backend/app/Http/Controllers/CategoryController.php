<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    // ─── GET /api/categories ───────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Category::withCount('books');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('name')->get());
    }

    // ─── POST /api/admin/categories ────────────────────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|unique:categories,name|max:255',
            'description' => 'nullable|string',
            'status'      => 'sometimes|in:active,inactive',
        ]);

        $category = Category::create($data);

        return response()->json(['message' => 'Category created.', 'category' => $category], 201);
    }

    // ─── GET /api/categories/{id} ──────────────────────────────────────────────
    public function show(Category $category)
    {
        $category->loadCount('books');
        return response()->json($category);
    }

    // ─── PUT /api/admin/categories/{id} ────────────────────────────────────────
    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|unique:categories,name,' . $category->id . '|max:255',
            'description' => 'nullable|string',
            'status'      => 'sometimes|in:active,inactive',
        ]);

        $category->update($data);

        return response()->json(['message' => 'Category updated.', 'category' => $category]);
    }

    // ─── DELETE /api/admin/categories/{id} ─────────────────────────────────────
    public function destroy(Category $category)
    {
        if ($category->books()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category with existing books.',
            ], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted.']);
    }
}

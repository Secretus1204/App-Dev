<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BookController extends Controller
{
    // ─── GET /api/books ────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Book::with('category');

        // Search by title, author, ISBN
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author', 'like', "%{$search}%")
                  ->orWhere('isbn', 'like', "%{$search}%");
            });
        }

        // Filter by category
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $books = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($books);
    }

    // ─── POST /api/admin/books ─────────────────────────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'isbn'             => 'required|string|unique:books,isbn',
            'title'            => 'required|string|max:255',
            'author'           => 'required|string|max:255',
            'publisher'        => 'nullable|string|max:255',
            'publication_year' => 'nullable|integer|min:1000|max:' . (date('Y') + 1),
            'category_id'      => 'required|exists:categories,id',
            'cover_image'      => 'nullable|image|max:2048',
            'quantity'         => 'required|integer|min:1',
            'description'      => 'nullable|string',
            'status'           => 'sometimes|in:available,limited,unavailable,archived',
        ]);

        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('covers', 'public');
        }

        $data['available_quantity'] = $data['quantity'];

        $book = Book::create($data);
        $book->load('category');

        return response()->json(['message' => 'Book added successfully.', 'book' => $book], 201);
    }

    // ─── GET /api/books/{id} ───────────────────────────────────────────────────
    public function show(Book $book)
    {
        $book->load('category');
        return response()->json($book);
    }

    // ─── PUT /api/admin/books/{id} ─────────────────────────────────────────────
    public function update(Request $request, Book $book)
    {
        $data = $request->validate([
            'isbn'             => 'sometimes|string|unique:books,isbn,' . $book->id,
            'title'            => 'sometimes|string|max:255',
            'author'           => 'sometimes|string|max:255',
            'publisher'        => 'nullable|string|max:255',
            'publication_year' => 'nullable|integer|min:1000|max:' . (date('Y') + 1),
            'category_id'      => 'sometimes|exists:categories,id',
            'cover_image'      => 'nullable|image|max:2048',
            'quantity'         => 'sometimes|integer|min:1',
            'description'      => 'nullable|string',
            'status'           => 'sometimes|in:available,limited,unavailable,archived',
        ]);

        if ($request->hasFile('cover_image')) {
            // Delete old cover
            if ($book->cover_image) {
                Storage::disk('public')->delete($book->cover_image);
            }
            $data['cover_image'] = $request->file('cover_image')->store('covers', 'public');
        }

        // Adjust available_quantity if total quantity changed
        if (isset($data['quantity'])) {
            $diff = $data['quantity'] - $book->quantity;
            $data['available_quantity'] = max(0, $book->available_quantity + $diff);
        }

        $book->update($data);
        $book->load('category');

        return response()->json(['message' => 'Book updated successfully.', 'book' => $book]);
    }

    // ─── DELETE /api/admin/books/{id} ──────────────────────────────────────────
    public function destroy(Book $book)
    {
        if ($book->cover_image) {
            Storage::disk('public')->delete($book->cover_image);
        }

        $book->delete();

        return response()->json(['message' => 'Book deleted successfully.']);
    }
}

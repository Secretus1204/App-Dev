<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Book\ArchiveBookRequest;
use App\Http\Requests\Book\IndexBookRequest;
use App\Http\Requests\Book\StoreBookCoverRequest;
use App\Http\Requests\Book\StoreBookRequest;
use App\Http\Requests\Book\UpdateBookRequest;
use App\Http\Resources\BookResource;
use App\Models\Book;
use App\Services\BookService;
use App\Support\ApiResponse;
use App\Support\PaginationData;
use Illuminate\Http\JsonResponse;

class BookController extends Controller
{
    public function __construct(
        private readonly BookService $books,
    ) {}

    public function index(IndexBookRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Book::class);
        $books = $this->books->paginate($request->validated(), $request->user());

        return ApiResponse::success(
            BookResource::collection($books->getCollection())->resolve($request),
            meta: PaginationData::from($books),
        );
    }

    public function show(IndexBookRequest $request, Book $book): JsonResponse
    {
        $this->authorize('view', $book);
        $book = $this->books->show($book, $request->user());

        return ApiResponse::success(BookResource::make($book)->resolve($request));
    }

    public function store(StoreBookRequest $request): JsonResponse
    {
        $this->authorize('create', Book::class);
        $book = $this->books->create($request->validated(), $request->user());

        return ApiResponse::success(
            BookResource::make($book)->resolve($request),
            'Book created successfully.',
            201,
        );
    }

    public function update(UpdateBookRequest $request, Book $book): JsonResponse
    {
        $this->authorize('update', $book);
        $book = $this->books->update($book, $request->validated(), $request->user());

        return ApiResponse::success(
            BookResource::make($book)->resolve($request),
            'Book updated successfully.',
        );
    }

    public function archive(ArchiveBookRequest $request, Book $book): JsonResponse
    {
        $this->authorize('update', $book);
        $book = $this->books->setActive($book, $request->boolean('is_active'), $request->user());

        return ApiResponse::success(
            BookResource::make($book)->resolve($request),
            $book->is_active ? 'Book restored successfully.' : 'Book archived successfully.',
        );
    }

    public function cover(StoreBookCoverRequest $request, Book $book): JsonResponse
    {
        $this->authorize('update', $book);
        $book = $this->books->replaceCover($book, $request->file('cover'), $request->user());

        return ApiResponse::success(
            BookResource::make($book)->resolve($request),
            'Book cover updated successfully.',
        );
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\BookCopy\ArchiveBookCopyRequest;
use App\Http\Requests\BookCopy\IndexBookCopyRequest;
use App\Http\Requests\BookCopy\StoreBookCopyRequest;
use App\Http\Requests\BookCopy\UpdateBookCopyRequest;
use App\Http\Resources\BookCopyResource;
use App\Models\Book;
use App\Models\BookCopy;
use App\Services\BookCopyService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class BookCopyController extends Controller
{
    public function __construct(
        private readonly BookCopyService $copies,
    ) {}

    public function index(IndexBookCopyRequest $request, Book $book): JsonResponse
    {
        $this->authorize('viewAny', BookCopy::class);
        $copies = $this->copies->list($book, $request->validated('status'));

        return ApiResponse::success(
            BookCopyResource::collection($copies)->resolve($request)
        );
    }

    public function store(StoreBookCopyRequest $request, Book $book): JsonResponse
    {
        $this->authorize('create', BookCopy::class);
        $copy = $this->copies->create($book, $request->validated(), $request->user());

        return ApiResponse::success(
            BookCopyResource::make($copy)->resolve($request),
            'Book copy created successfully.',
            201,
        );
    }

    public function update(UpdateBookCopyRequest $request, BookCopy $copy): JsonResponse
    {
        $this->authorize('update', $copy);
        $copy = $this->copies->update($copy, $request->validated(), $request->user());

        return ApiResponse::success(
            BookCopyResource::make($copy)->resolve($request),
            'Book copy updated successfully.',
        );
    }

    public function archive(ArchiveBookCopyRequest $request, BookCopy $copy): JsonResponse
    {
        $this->authorize('update', $copy);
        $copy = $this->copies->setArchived($copy, $request->boolean('archived'), $request->user());

        return ApiResponse::success(
            BookCopyResource::make($copy)->resolve($request),
            $copy->status->value === 'archived'
                ? 'Book copy archived successfully.'
                : 'Book copy restored successfully.',
        );
    }
}

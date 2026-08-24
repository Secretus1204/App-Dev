<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\BorrowRequest\IndexBorrowRequestRequest;
use App\Http\Requests\BorrowRequest\StoreBorrowRequestRequest;
use App\Http\Resources\BorrowRequestResource;
use App\Models\BorrowRequest;
use App\Services\BorrowRequestService;
use App\Support\ApiResponse;
use App\Support\PaginationData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BorrowRequestController extends Controller
{
    public function __construct(
        private readonly BorrowRequestService $requests,
    ) {}

    public function index(IndexBorrowRequestRequest $request): JsonResponse
    {
        $this->authorize('viewAny', BorrowRequest::class);
        $requests = $this->requests->paginateForUser($request->validated(), $request->user());

        return ApiResponse::success(
            BorrowRequestResource::collection($requests->getCollection())->resolve($request),
            meta: PaginationData::from($requests),
        );
    }

    public function show(Request $request, BorrowRequest $borrowRequest): JsonResponse
    {
        $this->authorize('view', $borrowRequest);

        return ApiResponse::success(
            BorrowRequestResource::make($this->requests->show($borrowRequest))->resolve($request)
        );
    }

    public function store(StoreBorrowRequestRequest $request): JsonResponse
    {
        $this->authorize('create', BorrowRequest::class);
        $borrowRequest = $this->requests->create($request->integer('book_id'), $request->user());

        return ApiResponse::success(
            BorrowRequestResource::make($borrowRequest)->resolve($request),
            'Borrow request submitted successfully.',
            201,
        );
    }

    public function cancel(Request $request, BorrowRequest $borrowRequest): JsonResponse
    {
        $this->authorize('cancel', $borrowRequest);
        $borrowRequest = $this->requests->cancel($borrowRequest, $request->user());

        return ApiResponse::success(
            BorrowRequestResource::make($borrowRequest)->resolve($request),
            'Borrow request cancelled successfully.',
        );
    }
}

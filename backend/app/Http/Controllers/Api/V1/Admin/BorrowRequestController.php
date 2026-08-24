<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\BorrowRequest\ApproveBorrowRequestRequest;
use App\Http\Requests\BorrowRequest\IndexBorrowRequestRequest;
use App\Http\Requests\BorrowRequest\RejectBorrowRequestRequest;
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
        $requests = $this->requests->paginateForAdmin($request->validated());

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

    public function approve(ApproveBorrowRequestRequest $request, BorrowRequest $borrowRequest): JsonResponse
    {
        $this->authorize('review', $borrowRequest);
        $borrowRequest = $this->requests->approve($borrowRequest, $request->validated(), $request->user());

        return ApiResponse::success(
            BorrowRequestResource::make($borrowRequest)->resolve($request),
            'Borrow request approved successfully.',
        );
    }

    public function reject(RejectBorrowRequestRequest $request, BorrowRequest $borrowRequest): JsonResponse
    {
        $this->authorize('review', $borrowRequest);
        $borrowRequest = $this->requests->reject($borrowRequest, $request->validated(), $request->user());

        return ApiResponse::success(
            BorrowRequestResource::make($borrowRequest)->resolve($request),
            'Borrow request rejected successfully.',
        );
    }
}

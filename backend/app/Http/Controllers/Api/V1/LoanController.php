<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Loan\IndexLoanRequest;
use App\Http\Resources\LoanResource;
use App\Models\Loan;
use App\Services\LoanService;
use App\Support\ApiResponse;
use App\Support\PaginationData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoanController extends Controller
{
    public function __construct(private readonly LoanService $loans) {}

    public function index(IndexLoanRequest $request): JsonResponse
    {
        $this->authorize('viewAny', Loan::class);
        $loans = $this->loans->paginateForUser($request->validated(), $request->user());

        return ApiResponse::success(
            LoanResource::collection($loans->getCollection())->resolve($request),
            meta: PaginationData::from($loans),
        );
    }

    public function show(Request $request, Loan $loan): JsonResponse
    {
        $this->authorize('view', $loan);

        return ApiResponse::success(LoanResource::make($this->loans->show($loan))->resolve($request));
    }
}

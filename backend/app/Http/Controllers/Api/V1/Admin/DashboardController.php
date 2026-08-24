<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\BorrowRequestResource;
use App\Http\Resources\LoanResource;
use App\Services\OperationalReportService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private readonly OperationalReportService $reports) {}

    public function show(Request $request): JsonResponse
    {
        $data = $this->reports->dashboard();
        $data['recent_requests'] = BorrowRequestResource::collection($data['recent_requests'])->resolve($request);
        $data['current_loans'] = LoanResource::collection($data['current_loans'])->resolve($request);

        return ApiResponse::success($data);
    }
}

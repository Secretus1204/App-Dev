<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HealthController extends Controller
{
    public function show(): JsonResponse
    {
        return ApiResponse::success([
            'service' => config('app.name'),
            'api_version' => 'v1',
            'status' => 'ok',
            'timestamp' => now()->toISOString(),
        ], 'API is healthy.');
    }

    public function admin(Request $request): JsonResponse
    {
        return ApiResponse::success([
            'status' => 'ok',
            'admin_id' => $request->user()->id,
        ], 'Admin authorization is working.');
    }
}

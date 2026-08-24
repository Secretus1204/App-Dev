<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use App\Support\PaginationData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate(['per_page' => ['sometimes', 'integer', 'min:1', 'max:100']]);
        $notifications = $this->notifications->paginate($request->user(), $request->integer('per_page', 20));

        return ApiResponse::success(
            NotificationResource::collection($notifications->getCollection())->resolve($request),
            meta: array_merge(PaginationData::from($notifications), [
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ]),
        );
    }

    public function read(Request $request, string $notification): JsonResponse
    {
        return ApiResponse::success(
            NotificationResource::make($this->notifications->markRead($request->user(), $notification))->resolve($request),
            'Notification marked as read.',
        );
    }

    public function readAll(Request $request): JsonResponse
    {
        $count = $this->notifications->markAllRead($request->user());

        return ApiResponse::success(['updated' => $count], 'All notifications marked as read.');
    }
}

<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\User\IndexUserRequest;
use App\Http\Requests\Admin\User\StoreUserRequest;
use App\Http\Requests\Admin\User\UpdateUserRequest;
use App\Http\Requests\Admin\User\UpdateUserStatusRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserManagementService;
use App\Support\ApiResponse;
use App\Support\PaginationData;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function __construct(
        private readonly UserManagementService $users,
    ) {}

    public function index(IndexUserRequest $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);
        $users = $this->users->paginate($request->validated());

        return ApiResponse::success(
            UserResource::collection($users->getCollection())->resolve($request),
            meta: PaginationData::from($users),
        );
    }

    public function show(IndexUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return ApiResponse::success(
            UserResource::make($this->users->show($user))->resolve($request)
        );
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);
        $user = $this->users->create($request->validated(), $request->user());

        return ApiResponse::success(
            UserResource::make($user)->resolve($request),
            'Account created successfully. The temporary password must be changed at first login.',
            201,
        );
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);
        $user = $this->users->update($user, $request->validated(), $request->user());

        return ApiResponse::success(
            UserResource::make($user)->resolve($request),
            'Account details updated successfully.',
        );
    }

    public function updateStatus(UpdateUserStatusRequest $request, User $user): JsonResponse
    {
        $this->authorize('changeStatus', $user);
        $user = $this->users->updateStatus(
            $user,
            UserStatus::from($request->string('status')->toString()),
            $request->user(),
        );

        return ApiResponse::success(
            UserResource::make($user)->resolve($request),
            'Account status updated successfully.',
        );
    }
}

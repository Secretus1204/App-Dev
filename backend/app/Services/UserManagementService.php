<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Exceptions\DomainConflictException;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserManagementService
{
    public function __construct(
        private readonly UserRepositoryContract $users,
        private readonly AuditService $audit,
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->users->paginate($filters);
    }

    public function show(User $user): User
    {
        return $this->users->loadForView($user);
    }

    public function create(array $attributes, User $actor): User
    {
        return DB::transaction(function () use ($attributes, $actor): User {
            $role = UserRole::from($attributes['role']);
            $status = UserStatus::from($attributes['status'] ?? UserStatus::Active->value);

            if ($role === UserRole::Admin && $status === UserStatus::Pending) {
                throw new DomainConflictException('Admin accounts cannot use the pending approval status.');
            }

            $user = $this->users->create([
                'name' => $attributes['name'],
                'member_id' => $role === UserRole::Admin ? null : $attributes['member_id'],
                'email' => $attributes['email'],
                'password' => Hash::make($attributes['password']),
                'role' => $role,
                'status' => $status,
                'must_change_password' => true,
                'created_by' => $actor->id,
            ]);

            $this->audit->record($actor, 'user.created', $user, after: $user->toArray());

            return $this->users->loadForView($user);
        });
    }

    public function update(User $user, array $attributes, User $actor): User
    {
        return DB::transaction(function () use ($user, $attributes, $actor): User {
            $before = $user->toArray();
            $user = $this->users->update($user, $attributes);
            $this->audit->record($actor, 'user.updated', $user, $before, $user->toArray());

            return $user;
        });
    }

    public function updateStatus(User $user, UserStatus $status, User $actor): User
    {
        if ($actor->is($user)) {
            throw new DomainConflictException('You cannot change the status of your own account.');
        }

        if ($user->isAdmin() && $status === UserStatus::Pending) {
            throw new DomainConflictException('Admin accounts cannot use the pending approval status.');
        }

        return DB::transaction(function () use ($user, $status, $actor): User {
            $before = $user->toArray();
            $user = $this->users->update($user, ['status' => $status]);

            if ($status !== UserStatus::Active) {
                $user->tokens()->delete();
            }

            $this->audit->record($actor, 'user.status.updated', $user, $before, $user->toArray());

            return $user;
        });
    }
}

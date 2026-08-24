<?php

namespace App\Repositories;

use App\Enums\LoanStatus;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserRepository implements UserRepositoryContract
{
    public function create(array $attributes): User
    {
        return User::query()->create($attributes);
    }

    public function findByEmail(string $email): ?User
    {
        return User::query()->where('email', $email)->first();
    }

    public function recordLogin(User $user): User
    {
        $user->forceFill(['last_login_at' => now()])->save();

        return $user->refresh();
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = User::query()
            ->with(['creator:id,name,email'])
            ->withCount([
                'borrowRequests',
                'loans',
                'loans as active_loans_count' => fn ($query) => $query->whereIn('status', [
                    LoanStatus::Borrowed->value,
                    LoanStatus::Overdue->value,
                ]),
            ])
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($nested) use ($search): void {
                    $nested
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('member_id', 'like', "%{$search}%");
                });
            })
            ->when($filters['role'] ?? null, fn ($query, string $role) => $query->where('role', $role))
            ->when($filters['status'] ?? null, fn ($query, string $status) => $query->where('status', $status));

        return $query
            ->orderBy($filters['sort'] ?? 'created_at', $filters['direction'] ?? 'desc')
            ->paginate($filters['per_page'] ?? 20)
            ->withQueryString();
    }

    public function loadForView(User $user): User
    {
        return $user
            ->load(['creator:id,name,email'])
            ->loadCount([
                'borrowRequests',
                'loans',
                'loans as active_loans_count' => fn ($query) => $query->whereIn('status', [
                    LoanStatus::Borrowed->value,
                    LoanStatus::Overdue->value,
                ]),
            ]);
    }

    public function update(User $user, array $attributes): User
    {
        $user->update($attributes);

        return $this->loadForView($user->refresh());
    }
}

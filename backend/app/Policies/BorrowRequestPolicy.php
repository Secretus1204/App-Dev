<?php

namespace App\Policies;

use App\Enums\BorrowRequestStatus;
use App\Models\BorrowRequest;
use App\Models\User;

class BorrowRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isActive();
    }

    public function view(User $user, BorrowRequest $borrowRequest): bool
    {
        return $user->isAdmin() || $borrowRequest->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isActive() && ! $user->isAdmin();
    }

    public function cancel(User $user, BorrowRequest $borrowRequest): bool
    {
        return ! $user->isAdmin()
            && $borrowRequest->user_id === $user->id
            && $borrowRequest->status === BorrowRequestStatus::Pending;
    }

    public function review(User $user, BorrowRequest $borrowRequest): bool
    {
        return $user->isAdmin();
    }
}

<?php

namespace App\Policies;

use App\Models\Loan;
use App\Models\User;

class LoanPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isActive();
    }

    public function view(User $user, Loan $loan): bool
    {
        return $user->isAdmin() || $loan->user_id === $user->id;
    }

    public function recordReturn(User $user, Loan $loan): bool
    {
        return $user->isAdmin();
    }
}

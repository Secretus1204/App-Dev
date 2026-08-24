<?php

namespace App\Policies;

use App\Models\Book;
use App\Models\User;

class BookPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isActive();
    }

    public function view(User $user, Book $book): bool
    {
        return $user->isAdmin() || ($book->is_active && $book->category->is_active);
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Book $book): bool
    {
        return $user->isAdmin();
    }
}

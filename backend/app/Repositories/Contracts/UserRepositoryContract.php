<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UserRepositoryContract
{
    public function create(array $attributes): User;

    public function findByEmail(string $email): ?User;

    public function recordLogin(User $user): User;

    public function paginate(array $filters): LengthAwarePaginator;

    public function loadForView(User $user): User;

    public function update(User $user, array $attributes): User;
}

<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Notifications\DatabaseNotification;

class NotificationService
{
    public function paginate(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return $user->notifications()->latest()->paginate($perPage);
    }

    public function markRead(User $user, string $id): DatabaseNotification
    {
        $notification = $user->notifications()->whereKey($id)->firstOrFail();
        $notification->markAsRead();

        return $notification->refresh();
    }

    public function markAllRead(User $user): int
    {
        return $user->unreadNotifications()->update(['read_at' => now()]);
    }
}

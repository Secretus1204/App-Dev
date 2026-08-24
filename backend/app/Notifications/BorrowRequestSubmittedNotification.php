<?php

namespace App\Notifications;

use App\Models\BorrowRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BorrowRequestSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly BorrowRequest $borrowRequest) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'borrow_request_submitted',
            'borrow_request_id' => $this->borrowRequest->id,
            'title' => 'New borrow request',
            'message' => sprintf(
                '%s requested "%s".',
                $this->borrowRequest->user->name,
                $this->borrowRequest->book->title,
            ),
        ];
    }
}

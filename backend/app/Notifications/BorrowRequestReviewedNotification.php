<?php

namespace App\Notifications;

use App\Models\BorrowRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BorrowRequestReviewedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly BorrowRequest $borrowRequest,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $status = $this->borrowRequest->status->value;
        $bookTitle = $this->borrowRequest->book->title;

        return [
            'type' => 'borrow_request_reviewed',
            'borrow_request_id' => $this->borrowRequest->id,
            'book_id' => $this->borrowRequest->book_id,
            'book_title' => $bookTitle,
            'status' => $status,
            'title' => "Borrow request {$status}",
            'message' => $status === 'approved'
                ? "Your request for \"{$bookTitle}\" was approved and is awaiting checkout."
                : "Your request for \"{$bookTitle}\" was rejected.",
            'rejection_reason' => $this->borrowRequest->rejection_reason,
        ];
    }
}

<?php

namespace App\Notifications;

use App\Models\Loan;
use App\Notifications\Channels\ExpoPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LoanReturnedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Loan $loan) {}

    public function via(object $notifiable): array
    {
        return ['database', ExpoPushChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'loan_returned',
            'loan_id' => $this->loan->id,
            'book_title' => $this->loan->bookCopy->book->title,
            'title' => 'Book returned',
            'message' => sprintf('Your return of "%s" was recorded.', $this->loan->bookCopy->book->title),
        ];
    }

    /** @return array{preference: string, title: string, body: string, data: array<string, int>} */
    public function toExpoPush(object $notifiable): array
    {
        return [
            'preference' => 'activity_enabled',
            'title' => 'Book returned',
            'body' => sprintf('Your return of "%s" was recorded.', $this->loan->bookCopy->book->title),
            'data' => ['loan_id' => $this->loan->id],
        ];
    }
}

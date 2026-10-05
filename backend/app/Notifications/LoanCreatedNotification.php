<?php

namespace App\Notifications;

use App\Models\Loan;
use App\Notifications\Channels\ExpoPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LoanCreatedNotification extends Notification
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
            'type' => 'loan_created',
            'loan_id' => $this->loan->id,
            'book_title' => $this->loan->bookCopy->book->title,
            'title' => 'Book checked out',
            'message' => sprintf(
                '"%s" has been checked out and is due on %s.',
                $this->loan->bookCopy->book->title,
                $this->loan->due_at->format('M j, Y'),
            ),
        ];
    }

    /** @return array{preference: string, title: string, body: string, data: array<string, int>} */
    public function toExpoPush(object $notifiable): array
    {
        return [
            'preference' => 'activity_enabled',
            'title' => 'Book checked out',
            'body' => sprintf('"%s" has been checked out and is due on %s.', $this->loan->bookCopy->book->title, $this->loan->due_at->format('M j, Y')),
            'data' => ['loan_id' => $this->loan->id],
        ];
    }
}

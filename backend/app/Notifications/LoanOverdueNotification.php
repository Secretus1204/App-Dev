<?php

namespace App\Notifications;

use App\Models\Loan;
use App\Notifications\Channels\ExpoPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LoanOverdueNotification extends Notification
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
            'type' => 'loan_overdue',
            'loan_id' => $this->loan->id,
            'book_title' => $this->loan->bookCopy->book->title,
            'title' => 'Book overdue',
            'message' => sprintf(
                '"%s" was due on %s. Please return it as soon as possible.',
                $this->loan->bookCopy->book->title,
                $this->loan->due_at->format('M j, Y'),
            ),
        ];
    }

    /** @return array{preference: string, title: string, body: string, data: array<string, int>} */
    public function toExpoPush(object $notifiable): array
    {
        return [
            'preference' => 'overdue_enabled',
            'title' => 'Book overdue',
            'body' => sprintf('"%s" was due on %s. Please return it as soon as possible.', $this->loan->bookCopy->book->title, $this->loan->due_at->format('M j, Y')),
            'data' => ['loan_id' => $this->loan->id],
        ];
    }
}

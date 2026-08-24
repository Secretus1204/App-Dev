<?php

namespace App\Notifications;

use App\Models\Loan;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LoanDueSoonNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Loan $loan) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'loan_due_soon',
            'loan_id' => $this->loan->id,
            'book_title' => $this->loan->bookCopy->book->title,
            'title' => 'Book due soon',
            'message' => sprintf(
                '"%s" is due on %s.',
                $this->loan->bookCopy->book->title,
                $this->loan->due_at->format('M j, Y'),
            ),
        ];
    }
}

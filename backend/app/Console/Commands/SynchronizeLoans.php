<?php

namespace App\Console\Commands;

use App\Services\LoanService;
use Illuminate\Console\Command;

class SynchronizeLoans extends Command
{
    protected $signature = 'library:sync-loans';

    protected $description = 'Synchronize overdue loan statuses and send member notifications';

    public function handle(LoanService $loans): int
    {
        $overdue = $loans->synchronizeOverdue();
        $dueSoon = $loans->sendDueSoonNotifications();
        $this->info("Synchronized {$overdue} overdue loan(s) and sent {$dueSoon} due-soon notification(s).");

        return self::SUCCESS;
    }
}

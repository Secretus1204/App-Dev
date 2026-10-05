<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Keeps overdue status and due-date reminders timely without sending repeated
// alerts; LoanService records each reminder only once per loan.
Schedule::command('library:sync-loans')->everyFifteenMinutes()->withoutOverlapping();

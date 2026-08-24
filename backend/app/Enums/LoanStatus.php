<?php

namespace App\Enums;

enum LoanStatus: string
{
    case Borrowed = 'borrowed';
    case Overdue = 'overdue';
    case Returned = 'returned';
}

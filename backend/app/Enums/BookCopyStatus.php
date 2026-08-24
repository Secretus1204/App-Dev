<?php

namespace App\Enums;

enum BookCopyStatus: string
{
    case Available = 'available';
    case Borrowed = 'borrowed';
    case Lost = 'lost';
    case Damaged = 'damaged';
    case Archived = 'archived';
}

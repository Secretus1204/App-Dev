<?php

namespace App\Repositories\Contracts;

use App\Models\Loan;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface LoanRepositoryContract
{
    public function paginate(array $filters, ?User $owner = null): LengthAwarePaginator;

    public function loadForView(Loan $loan): Loan;

    public function lockForUpdate(Loan $loan): Loan;
}

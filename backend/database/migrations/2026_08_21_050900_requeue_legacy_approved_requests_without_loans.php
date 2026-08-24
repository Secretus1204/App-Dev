<?php

use App\Enums\BorrowRequestStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('borrow_requests')
            ->where('status', BorrowRequestStatus::Approved->value)
            ->whereNotExists(fn ($query) => $query
                ->selectRaw('1')
                ->from('loans')
                ->whereColumn('loans.borrow_request_id', 'borrow_requests.id'))
            ->update([
                'status' => BorrowRequestStatus::Pending->value,
                'reviewed_at' => null,
                'reviewed_by' => null,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // This compatibility repair is intentionally not reversed because doing so
        // would recreate approved requests without their required loan records.
    }
};

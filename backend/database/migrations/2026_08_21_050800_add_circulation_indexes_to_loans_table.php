<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loans', function (Blueprint $table): void {
            $table->index(['user_id', 'status'], 'loans_user_status_index');
            $table->index(['book_copy_id', 'status'], 'loans_copy_status_index');
            $table->index(['status', 'due_at'], 'loans_status_due_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table): void {
            $table->dropIndex('loans_user_status_index');
            $table->dropIndex('loans_copy_status_index');
            $table->dropIndex('loans_status_due_at_index');
        });
    }
};

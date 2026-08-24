<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('member_id', 50)->nullable()->unique();
            $table->string('role', 20)->default(UserRole::User->value)->index();
            $table->string('status', 20)->default(UserStatus::Active->value)->index();
            $table->boolean('must_change_password')->default(false);
            $table->timestamp('last_login_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('created_by');
            $table->dropUnique(['member_id']);
            $table->dropIndex(['role']);
            $table->dropIndex(['status']);
            $table->dropColumn([
                'member_id',
                'role',
                'status',
                'must_change_password',
                'last_login_at',
            ]);
        });
    }
};

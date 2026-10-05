<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('library_card_code', 64)->nullable()->unique()->after('member_id');
        });

        Schema::table('book_copies', function (Blueprint $table): void {
            $table->string('qr_code', 64)->nullable()->unique()->after('barcode');
        });

        DB::table('users')
            ->whereNull('library_card_code')
            ->orderBy('id')
            ->eachById(function (object $user): void {
                DB::table('users')->where('id', $user->id)->update([
                    'library_card_code' => 'RCJK-MEMBER-'.Str::upper((string) Str::ulid()),
                    'updated_at' => now(),
                ]);
            });

        DB::table('book_copies')
            ->whereNull('qr_code')
            ->orderBy('id')
            ->eachById(function (object $copy): void {
                DB::table('book_copies')->where('id', $copy->id)->update([
                    'qr_code' => 'RCJK-COPY-'.Str::upper((string) Str::ulid()),
                    'updated_at' => now(),
                ]);
            });
    }

    public function down(): void
    {
        Schema::table('book_copies', function (Blueprint $table): void {
            $table->dropUnique(['qr_code']);
            $table->dropColumn('qr_code');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['library_card_code']);
            $table->dropColumn('library_card_code');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            // Preferences belong to the member, while a device token belongs
            // to one installation of the Android application.
            $table->json('notification_preferences')->nullable()->after('library_card_code');
        });

        Schema::create('push_devices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('expo_push_token', 255)->unique();
            $table->string('platform', 20)->default('android');
            $table->boolean('is_enabled')->default(true)->index();
            $table->timestamp('last_seen_at')->nullable()->index();
            $table->timestamps();

            $table->index(['user_id', 'is_enabled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_devices');

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('notification_preferences');
        });
    }
};

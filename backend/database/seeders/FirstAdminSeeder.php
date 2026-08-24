<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

class FirstAdminSeeder extends Seeder
{
    public function run(): void
    {
        $name = trim((string) config('library.first_admin.name'));
        $email = Str::lower(trim((string) config('library.first_admin.email')));
        $password = (string) config('library.first_admin.password');

        if ($email === '' || $password === '') {
            throw new RuntimeException(
                'Set LIBRARY_FIRST_ADMIN_EMAIL and LIBRARY_FIRST_ADMIN_PASSWORD before seeding.'
            );
        }

        $admin = User::query()->firstOrNew(['email' => $email]);
        $isNewAdmin = ! $admin->exists;

        $admin->forceFill([
            'name' => $name !== '' ? $name : 'Library Administrator',
            'member_id' => null,
            'role' => UserRole::Admin,
            'status' => UserStatus::Active,
            'must_change_password' => true,
            'email_verified_at' => now(),
        ]);

        if ($isNewAdmin) {
            $admin->password = Hash::make($password);
        }

        $admin->save();

        if ($isNewAdmin) {
            AuditLog::query()->create([
                'action' => 'admin.created',
                'subject_type' => User::class,
                'subject_id' => $admin->id,
                'after_data' => [
                    'email' => $admin->email,
                    'role' => $admin->role->value,
                    'status' => $admin->status->value,
                ],
            ]);
        }
    }
}

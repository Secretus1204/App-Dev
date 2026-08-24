<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Database\Seeders\FirstAdminSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class FirstAdminSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_admin_password_is_hashed_and_seed_is_idempotent(): void
    {
        config()->set('library.first_admin', [
            'name' => 'First Administrator',
            'email' => 'first.admin@example.com',
            'password' => 'temporary-password',
        ]);

        $this->seed(FirstAdminSeeder::class);
        $this->seed(FirstAdminSeeder::class);

        $admin = User::query()->where('email', 'first.admin@example.com')->firstOrFail();

        $this->assertSame(UserRole::Admin, $admin->role);
        $this->assertSame(UserStatus::Active, $admin->status);
        $this->assertTrue($admin->must_change_password);
        $this->assertNotSame('temporary-password', $admin->password);
        $this->assertTrue(Hash::check('temporary-password', $admin->password));
        $this->assertSame(1, User::query()->where('email', $admin->email)->count());
    }
}

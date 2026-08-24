<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserManagementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_search_filter_sort_and_paginate_accounts(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->create([
            'name' => 'Alpha Active Member',
            'email' => 'alpha-active@example.com',
            'status' => UserStatus::Active,
        ]);
        User::factory()->inactive()->create([
            'name' => 'Alpha Inactive Member',
            'email' => 'alpha-inactive@example.com',
        ]);
        User::factory()->create(['name' => 'Beta Member']);

        Sanctum::actingAs($admin);

        $this->getJson('/api/v1/admin/users?search=Alpha&role=user&status=active&sort=name&direction=asc&per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Alpha Active Member')
            ->assertJsonPath('data.0.role', UserRole::User->value)
            ->assertJsonPath('data.0.active_loans_count', 0)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.per_page', 1);
    }

    public function test_regular_user_cannot_access_admin_account_management(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/admin/users')->assertForbidden();
        $this->postJson('/api/v1/admin/users', [])->assertForbidden();
    }

    public function test_admin_can_create_member_and_admin_with_hashed_temporary_passwords(): void
    {
        $actor = User::factory()->admin()->create();
        Sanctum::actingAs($actor);

        $memberResponse = $this->postJson('/api/v1/admin/users', [
            'name' => 'Created Member',
            'member_id' => 'mem-90001',
            'email' => 'CREATED-MEMBER@EXAMPLE.COM',
            'role' => UserRole::User->value,
            'status' => UserStatus::Pending->value,
            'password' => 'temporary-password',
            'password_confirmation' => 'temporary-password',
        ])
            ->assertCreated()
            ->assertJsonPath('data.email', 'created-member@example.com')
            ->assertJsonPath('data.member_id', 'MEM-90001')
            ->assertJsonPath('data.role', UserRole::User->value)
            ->assertJsonPath('data.status', UserStatus::Pending->value)
            ->assertJsonPath('data.must_change_password', true)
            ->assertJsonMissingPath('data.password');

        $member = User::query()->findOrFail($memberResponse->json('data.id'));
        $this->assertTrue(Hash::check('temporary-password', $member->password));
        $this->assertSame($actor->id, $member->created_by);

        $this->postJson('/api/v1/admin/users', [
            'name' => 'Second Administrator',
            'email' => 'second-admin@example.com',
            'role' => UserRole::Admin->value,
            'status' => UserStatus::Active->value,
            'password' => 'temporary-password',
            'password_confirmation' => 'temporary-password',
        ])
            ->assertCreated()
            ->assertJsonPath('data.role', UserRole::Admin->value)
            ->assertJsonPath('data.member_id', null)
            ->assertJsonPath('data.must_change_password', true);

        $this->assertDatabaseHas('audit_logs', ['action' => 'user.created']);
    }

    public function test_account_creation_enforces_role_specific_member_id_rules(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->postJson('/api/v1/admin/users', [
            'name' => 'Member Without ID',
            'email' => 'missing-id@example.com',
            'role' => UserRole::User->value,
            'password' => 'temporary-password',
            'password_confirmation' => 'temporary-password',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('member_id');

        $this->postJson('/api/v1/admin/users', [
            'name' => 'Admin With Member ID',
            'member_id' => 'MEM-NOT-ALLOWED',
            'email' => 'admin-with-id@example.com',
            'role' => UserRole::Admin->value,
            'password' => 'temporary-password',
            'password_confirmation' => 'temporary-password',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('member_id');
    }

    public function test_admin_can_update_member_and_inactivation_revokes_tokens(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->create();
        $member->createToken('android-test');
        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/users/{$member->id}", [
            'name' => 'Updated Member',
            'member_id' => 'mem-77777',
            'email' => 'UPDATED@EXAMPLE.COM',
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated Member')
            ->assertJsonPath('data.member_id', 'MEM-77777')
            ->assertJsonPath('data.email', 'updated@example.com');

        $this->patchJson("/api/v1/admin/users/{$member->id}/status", [
            'status' => UserStatus::Inactive->value,
        ])
            ->assertOk()
            ->assertJsonPath('data.status', UserStatus::Inactive->value);

        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $member->id]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'user.status.updated']);
    }

    public function test_admin_cannot_change_own_status_or_create_pending_admin(): void
    {
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/users/{$admin->id}/status", [
            'status' => UserStatus::Inactive->value,
        ])->assertForbidden();

        $this->postJson('/api/v1/admin/users', [
            'name' => 'Pending Administrator',
            'email' => 'pending-admin@example.com',
            'role' => UserRole::Admin->value,
            'status' => UserStatus::Pending->value,
            'password' => 'temporary-password',
            'password_confirmation' => 'temporary-password',
        ])
            ->assertConflict()
            ->assertJsonPath('message', 'Admin accounts cannot use the pending approval status.');
    }

    public function test_admin_can_approve_a_member_when_approval_is_required(): void
    {
        config()->set('library.require_member_approval', true);

        $registration = $this->postJson('/api/v1/auth/register', [
            'name' => 'Pending Member',
            'member_id' => 'MEM-PENDING',
            'email' => 'pending-member@example.com',
            'password' => 'member-password',
            'password_confirmation' => 'member-password',
        ])
            ->assertCreated()
            ->assertJsonPath('data.user.status', UserStatus::Pending->value);

        $memberId = $registration->json('data.user.id');
        $memberToken = $registration->json('data.token');

        $this->withToken($memberToken)
            ->getJson('/api/v1/auth/me')
            ->assertForbidden();

        $admin = User::factory()->admin()->create();
        $adminToken = $admin->createToken('web-admin-test')->plainTextToken;

        $this->app['auth']->forgetGuards();
        $this->withToken($adminToken)
            ->patchJson("/api/v1/admin/users/{$memberId}/status", [
                'status' => UserStatus::Active->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', UserStatus::Active->value);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $memberId,
        ]);

        $this->app['auth']->forgetGuards();
        $this->postJson('/api/v1/auth/login', [
            'email' => 'pending-member@example.com',
            'password' => 'member-password',
        ])->assertOk();
    }
}

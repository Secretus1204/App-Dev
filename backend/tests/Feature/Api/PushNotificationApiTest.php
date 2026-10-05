<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Services\ExpoPushService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PushNotificationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_register_a_valid_expo_push_device(): void
    {
        $member = User::factory()->create();
        Sanctum::actingAs($member);

        $this->postJson('/api/v1/push-devices', [
            'expo_push_token' => 'ExponentPushToken[member-device-token]',
            'platform' => 'android',
        ])
            ->assertCreated()
            ->assertJsonPath('data.platform', 'android')
            ->assertJsonPath('data.is_enabled', true);

        $this->assertDatabaseHas('push_devices', [
            'user_id' => $member->id,
            'expo_push_token' => 'ExponentPushToken[member-device-token]',
            'is_enabled' => true,
        ]);
    }

    public function test_member_can_change_push_preferences(): void
    {
        $member = User::factory()->create();
        Sanctum::actingAs($member);

        $this->patchJson('/api/v1/notification-preferences', [
            'push_enabled' => false,
            'overdue_enabled' => false,
        ])
            ->assertOk()
            ->assertJsonPath('data.push_enabled', false)
            ->assertJsonPath('data.due_soon_enabled', true)
            ->assertJsonPath('data.overdue_enabled', false);

        $member->refresh();
        $this->assertFalse($member->notificationPreferences()['push_enabled']);
        $this->assertFalse($member->notificationPreferences()['overdue_enabled']);
    }

    public function test_member_cannot_remove_another_members_push_device(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $device = $owner->pushDevices()->create([
            'expo_push_token' => 'ExponentPushToken[other-member-device]',
            'platform' => 'android',
            'is_enabled' => true,
        ]);
        Sanctum::actingAs($other);

        $this->deleteJson("/api/v1/push-devices/{$device->id}")
            ->assertNotFound();

        $this->assertDatabaseHas('push_devices', ['id' => $device->id]);
    }

    public function test_enabled_member_device_receives_an_expo_push_request(): void
    {
        $member = User::factory()->create();
        $member->pushDevices()->create([
            'expo_push_token' => 'ExponentPushToken[delivery-test-device]',
            'platform' => 'android',
            'is_enabled' => true,
        ]);
        config()->set('services.expo.push_notifications_enabled', true);
        Http::fake(['https://exp.host/*' => Http::response(['data' => [['status' => 'ok']]])]);

        app(ExpoPushService::class)->send(
            $member,
            'due_soon_enabled',
            'Book due soon',
            'A due-date reminder.',
            ['loan_id' => 42],
        );

        Http::assertSent(function (Request $request): bool {
            $message = $request->data()[0] ?? [];

            return $request->url() === 'https://exp.host/--/api/v2/push/send'
                && $message['to'] === 'ExponentPushToken[delivery-test-device]'
                && $message['data']['loan_id'] === 42;
        });
    }

    public function test_disabled_push_preference_prevents_expo_delivery(): void
    {
        $member = User::factory()->create([
            'notification_preferences' => ['push_enabled' => false],
        ]);
        $member->pushDevices()->create([
            'expo_push_token' => 'ExponentPushToken[disabled-test-device]',
            'platform' => 'android',
            'is_enabled' => true,
        ]);
        config()->set('services.expo.push_notifications_enabled', true);
        Http::fake();

        app(ExpoPushService::class)->send($member, 'due_soon_enabled', 'Book due soon', 'A due-date reminder.');

        Http::assertNothingSent();
    }
}

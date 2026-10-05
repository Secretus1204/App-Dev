<?php

namespace App\Services;

use App\Models\PushDevice;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoPushService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function send(User $user, string $preference, string $title, string $body, array $data = []): void
    {
        if (! config('services.expo.push_notifications_enabled') || ! $user->wantsPushNotification($preference)) {
            return;
        }

        $devices = $user->pushDevices()->enabled()->get();
        if ($devices->isEmpty()) {
            return;
        }

        $messages = $devices->map(fn (PushDevice $device): array => [
            'to' => $device->expo_push_token,
            'title' => $title,
            'body' => $body,
            'sound' => 'default',
            'priority' => 'high',
            'data' => $data,
        ])->all();

        foreach (array_chunk($messages, 100) as $chunk) {
            try {
                $response = Http::acceptJson()
                    ->timeout(10)
                    ->post(config('services.expo.push_url'), $chunk);
            } catch (ConnectionException $exception) {
                Log::warning('Expo push service could not be reached.', ['message' => $exception->getMessage()]);

                return;
            }

            if (! $response->successful()) {
                Log::warning('Expo push service rejected a request.', ['status' => $response->status()]);

                continue;
            }

            $tickets = $response->json('data', []);
            foreach ($tickets as $index => $ticket) {
                if (($ticket['details']['error'] ?? null) !== 'DeviceNotRegistered') {
                    continue;
                }

                $token = $chunk[$index]['to'] ?? null;
                if ($token !== null) {
                    PushDevice::query()->where('expo_push_token', $token)->update(['is_enabled' => false]);
                }
            }
        }
    }
}

<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AuditService
{
    public function record(
        ?User $actor,
        string $action,
        Model $subject,
        ?array $before = null,
        ?array $after = null,
    ): void {
        $request = app()->bound('request') ? request() : null;

        // Artisan jobs have no browser/device request context. HTTP feature
        // tests also run through the console, but provide a user agent.
        if (app()->runningInConsole() && blank($request?->userAgent())) {
            $request = null;
        }
        $userAgent = $request?->userAgent();

        AuditLog::query()->create([
            'actor_id' => $actor?->id,
            'action' => $action,
            'subject_type' => $subject->getMorphClass(),
            'subject_id' => $subject->getKey(),
            'before_data' => $before,
            'after_data' => $after,
            'ip_address' => $request?->ip(),
            'user_agent' => blank($userAgent) ? null : Str::limit($userAgent, 1000, ''),
        ]);
    }
}

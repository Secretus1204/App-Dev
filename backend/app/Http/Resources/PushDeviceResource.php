<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PushDeviceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'platform' => $this->platform,
            'is_enabled' => $this->is_enabled,
            'last_seen_at' => $this->last_seen_at?->toISOString(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'member_id' => $this->member_id,
            'email' => $this->email,
            'role' => $this->role->value,
            'status' => $this->status->value,
            'must_change_password' => $this->must_change_password,
            'borrow_requests_count' => (int) ($this->borrow_requests_count ?? 0),
            'loans_count' => (int) ($this->loans_count ?? 0),
            'active_loans_count' => (int) ($this->active_loans_count ?? 0),
            'created_by' => $this->whenLoaded('creator', fn () => $this->creator === null ? null : [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
                'email' => $this->creator->email,
            ]),
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'last_login_at' => $this->last_login_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

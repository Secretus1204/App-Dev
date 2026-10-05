<?php

namespace App\Http\Requests\Notification;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'push_enabled' => ['sometimes', 'boolean'],
            'due_soon_enabled' => ['sometimes', 'boolean'],
            'overdue_enabled' => ['sometimes', 'boolean'],
            'activity_enabled' => ['sometimes', 'boolean'],
        ];
    }
}

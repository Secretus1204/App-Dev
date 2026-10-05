<?php

namespace App\Http\Requests\Notification;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterPushDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'expo_push_token' => ['required', 'string', 'max:255', 'regex:/^ExponentPushToken\[[^\]]+\]$|^ExpoPushToken\[[^\]]+\]$/'],
            'platform' => ['required', Rule::in(['android', 'ios'])],
        ];
    }
}

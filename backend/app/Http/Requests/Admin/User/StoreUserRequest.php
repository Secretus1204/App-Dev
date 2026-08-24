<?php

namespace App\Http\Requests\Admin\User;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => mb_strtolower(trim((string) $this->input('email'))),
            'member_id' => $this->filled('member_id')
                ? mb_strtoupper(trim((string) $this->input('member_id')))
                : null,
        ]);
    }

    public function rules(): array
    {
        $isAdmin = $this->input('role') === UserRole::Admin->value;

        return [
            'name' => ['required', 'string', 'max:150'],
            'member_id' => [
                Rule::requiredIf(! $isAdmin),
                Rule::prohibitedIf($isAdmin),
                'nullable',
                'string',
                'max:50',
                'unique:users,member_id',
            ],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::enum(UserRole::class)],
            'status' => ['sometimes', Rule::enum(UserStatus::class)],
            'password' => ['required', 'confirmed', Password::min(8)],
        ];
    }
}

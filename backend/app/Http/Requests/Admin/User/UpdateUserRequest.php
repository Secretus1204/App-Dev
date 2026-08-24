<?php

namespace App\Http\Requests\Admin\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $attributes = [];

        if ($this->has('email')) {
            $attributes['email'] = mb_strtolower(trim((string) $this->input('email')));
        }

        if ($this->has('member_id')) {
            $attributes['member_id'] = $this->filled('member_id')
                ? mb_strtoupper(trim((string) $this->input('member_id')))
                : null;
        }

        $this->merge($attributes);
    }

    public function rules(): array
    {
        $user = $this->route('user');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'member_id' => [
                'sometimes',
                Rule::requiredIf(! $user->isAdmin()),
                Rule::prohibitedIf($user->isAdmin()),
                'nullable',
                'string',
                'max:50',
                Rule::unique('users', 'member_id')->ignore($user),
            ],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user),
            ],
        ];
    }
}

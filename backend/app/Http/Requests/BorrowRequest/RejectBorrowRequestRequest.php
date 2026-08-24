<?php

namespace App\Http\Requests\BorrowRequest;

use Illuminate\Foundation\Http\FormRequest;

class RejectBorrowRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rejection_reason' => ['required', 'string', 'max:2000'],
            'admin_notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}

<?php

namespace App\Http\Requests\BorrowRequest;

use Illuminate\Foundation\Http\FormRequest;

class ApproveBorrowRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'book_copy_id' => ['sometimes', 'nullable', 'integer', 'exists:book_copies,id'],
            'due_at' => ['sometimes', 'nullable', 'date', 'after:now'],
            'admin_notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}

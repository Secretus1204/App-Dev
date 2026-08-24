<?php

namespace App\Http\Requests\BorrowRequest;

use Illuminate\Foundation\Http\FormRequest;

class StoreBorrowRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'book_id' => ['required', 'integer', 'exists:books,id'],
        ];
    }
}

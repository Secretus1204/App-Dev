<?php

namespace App\Http\Requests\BorrowRequest;

use App\Enums\BorrowRequestStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexBorrowRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'string', 'max:150'],
            'status' => ['sometimes', Rule::enum(BorrowRequestStatus::class)],
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'book_id' => ['sometimes', 'integer', 'exists:books,id'],
            'sort' => ['sometimes', Rule::in(['requested_at', 'reviewed_at', 'created_at'])],
            'direction' => ['sometimes', Rule::in(['asc', 'desc'])],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}

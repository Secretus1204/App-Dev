<?php

namespace App\Http\Requests\BookCopy;

use App\Enums\BookCopyStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexBookCopyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', Rule::enum(BookCopyStatus::class)],
        ];
    }
}

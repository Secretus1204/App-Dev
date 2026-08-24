<?php

namespace App\Http\Requests\BookCopy;

use App\Enums\BookCopyStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBookCopyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'accession_number' => [
                'sometimes',
                'required',
                'string',
                'max:80',
                Rule::unique('book_copies', 'accession_number')->ignore($this->route('copy')),
            ],
            'barcode' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                Rule::unique('book_copies', 'barcode')->ignore($this->route('copy')),
            ],
            'status' => [
                'sometimes',
                Rule::in([
                    BookCopyStatus::Available->value,
                    BookCopyStatus::Lost->value,
                    BookCopyStatus::Damaged->value,
                ]),
            ],
            'condition_notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}

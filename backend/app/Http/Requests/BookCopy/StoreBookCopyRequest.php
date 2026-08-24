<?php

namespace App\Http\Requests\BookCopy;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookCopyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'accession_number' => ['nullable', 'string', 'max:80', 'unique:book_copies,accession_number'],
            'barcode' => ['nullable', 'string', 'max:100', 'unique:book_copies,barcode'],
            'condition_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

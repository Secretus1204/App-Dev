<?php

namespace App\Http\Requests\Book;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => [
                'required',
                'integer',
                Rule::exists('categories', 'id')->where('is_active', true),
            ],
            'isbn' => ['nullable', 'string', 'max:20', 'unique:books,isbn'],
            'title' => ['required', 'string', 'max:255'],
            'author' => ['required', 'string', 'max:255'],
            'publisher' => ['nullable', 'string', 'max:255'],
            'publication_year' => ['nullable', 'integer', 'min:1000', 'max:'.((int) date('Y') + 1)],
            'description' => ['nullable', 'string', 'max:10000'],
            'initial_copies' => ['sometimes', 'integer', 'min:0', 'max:100'],
        ];
    }
}

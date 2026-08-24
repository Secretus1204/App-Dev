<?php

namespace App\Http\Requests\Book;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'string', 'max:150'],
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'availability' => ['sometimes', Rule::in(['available', 'limited', 'unavailable'])],
            'sort' => ['sometimes', Rule::in(['title', 'author', 'publication_year', 'created_at'])],
            'direction' => ['sometimes', Rule::in(['asc', 'desc'])],
            'include_archived' => ['sometimes', 'boolean'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}

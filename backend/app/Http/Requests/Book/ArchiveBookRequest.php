<?php

namespace App\Http\Requests\Book;

use Illuminate\Foundation\Http\FormRequest;

class ArchiveBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['is_active' => ['required', 'boolean']];
    }
}

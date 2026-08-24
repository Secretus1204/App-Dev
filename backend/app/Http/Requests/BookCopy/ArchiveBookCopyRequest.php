<?php

namespace App\Http\Requests\BookCopy;

use Illuminate\Foundation\Http\FormRequest;

class ArchiveBookCopyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['archived' => ['required', 'boolean']];
    }
}

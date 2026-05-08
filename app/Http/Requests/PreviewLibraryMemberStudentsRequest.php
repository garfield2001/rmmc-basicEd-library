<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PreviewLibraryMemberStudentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'student_ids' => ['required', 'string', 'max:30000'],
            'section' => ['nullable', 'string', 'max:255'],
        ];
    }
}

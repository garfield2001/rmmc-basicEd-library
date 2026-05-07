<?php

namespace App\Http\Requests;

use App\Support\Academics\AcademicLevels;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'year_level' => ['required', Rule::in(AcademicLevels::options())],
            'section' => ['nullable', 'string', 'max:255'],
        ];
    }
}

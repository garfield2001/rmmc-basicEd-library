<?php

namespace App\Http\Requests;

use App\Support\Academics\AcademicLevels;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkAssignLibraryMemberStudentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'member_ids' => ['required', 'array', 'min:1'],
            'member_ids.*' => ['integer', Rule::exists('library_members', 'id')],
            'year_level' => ['required', Rule::in(AcademicLevels::options())],
            'section' => ['nullable', 'string', 'max:255'],
        ];
    }
}

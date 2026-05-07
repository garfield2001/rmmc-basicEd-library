<?php

namespace App\Http\Requests;

use App\Support\Academics\AcademicLevels;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class PreviewStudentRosterPlacementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'school_year_id' => ['required', Rule::exists('school_years', 'id')],
            'student_ids' => ['required', 'string', 'max:30000'],
            'year_level' => ['required', Rule::in(AcademicLevels::options())],
            'section' => ['nullable', 'string', 'max:255'],
            'filters' => ['sometimes', 'array'],
            'filters.source_school_year_id' => ['nullable', Rule::exists('school_years', 'id')],
            'filters.source_year_level' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $sourceSchoolYearId = $this->input('filters.source_school_year_id');

            if ($sourceSchoolYearId && (int) $sourceSchoolYearId === (int) $this->input('school_year_id')) {
                $validator->errors()->add('school_year_id', 'Source and target school years must be different before previewing placement.');
            }
        });
    }
}

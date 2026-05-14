<?php

namespace App\Http\Requests;

use App\Models\SchoolYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ReportFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'school_year_id' => ['nullable', Rule::exists('school_years', 'id')],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'visitor_type' => ['nullable', Rule::in(['student', 'employee'])],
            'year_level' => ['nullable', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('start_date') || $validator->errors()->has('end_date') || $validator->errors()->has('school_year_id')) {
                    return;
                }

                $schoolYear = $this->selectedSchoolYear();

                if (! $schoolYear) {
                    return;
                }

                $startDate = $this->date('start_date');
                $endDate = $this->date('end_date');

                $schoolYearStart = $schoolYear->starts_at->copy()->startOfDay();
                $schoolYearEnd = $schoolYear->ends_at->copy()->endOfDay();

                if ($startDate && $startDate->lt($schoolYearStart)) {
                    $validator->errors()->add('start_date', 'The start date must be within the selected school year.');
                }

                if ($startDate && $startDate->gt($schoolYearEnd)) {
                    $validator->errors()->add('start_date', 'The start date must be within the selected school year.');
                }

                if ($endDate && $endDate->lt($schoolYearStart)) {
                    $validator->errors()->add('end_date', 'The end date must be within the selected school year.');
                }

                if ($endDate && $endDate->gt($schoolYearEnd)) {
                    $validator->errors()->add('end_date', 'The end date must be within the selected school year.');
                }
            },
        ];
    }

    private function selectedSchoolYear(): ?SchoolYear
    {
        $schoolYearId = $this->integer('school_year_id') ?: SchoolYear::active()->value('id');

        if (! $schoolYearId) {
            return null;
        }

        return SchoolYear::query()->find($schoolYearId);
    }
}

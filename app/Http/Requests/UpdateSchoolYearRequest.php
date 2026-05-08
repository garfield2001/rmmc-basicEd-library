<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSchoolYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $schoolYearId = $this->route('schoolYear')?->id;

        return [
            'name' => ['required', 'string', 'max:32', Rule::unique('school_years', 'name')->ignore($schoolYearId)],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'minimum_visits' => ['required', 'integer', 'min:0', 'max:255'],
            'target_visits' => ['required', 'integer', 'min:0', 'max:255', 'gte:minimum_visits'],
            'make_active' => ['sometimes', 'boolean'],
        ];
    }
}

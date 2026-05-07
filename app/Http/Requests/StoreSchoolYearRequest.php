<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSchoolYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:32', 'unique:school_years,name'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'minimum_visits' => ['required', 'integer', 'min:0', 'max:255'],
            'target_visits' => ['required', 'integer', 'min:0', 'max:255', 'gte:minimum_visits'],
            'make_active' => ['sometimes', 'boolean'],
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkAssignRegisteredVisitorStudentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'visitor_ids' => ['required', 'array', 'min:1'],
            'visitor_ids.*' => ['integer', Rule::exists('registered_visitors', 'id')],
            'section' => ['nullable', 'string', 'max:255'],
        ];
    }
}

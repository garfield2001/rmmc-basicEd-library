<?php

namespace App\Http\Requests;

use App\Models\RegisteredVisitor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkDestroyRegisteredVisitorsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'select_all' => ['sometimes', 'boolean'],
            'visitor_ids' => [
                Rule::excludeIf(fn (): bool => $this->boolean('select_all')),
                Rule::requiredIf(fn (): bool => ! $this->boolean('select_all')),
                'array',
                'min:1',
            ],
            'visitor_ids.*' => ['integer', 'distinct', Rule::exists('registered_visitors', 'id')->whereNull('deleted_at')],
            'type' => ['required', Rule::in([RegisteredVisitor::TYPE_STUDENT, RegisteredVisitor::TYPE_EMPLOYEE])],
            'search' => ['nullable', 'string', 'max:255'],
            'year_level' => ['nullable', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
        ];
    }
}

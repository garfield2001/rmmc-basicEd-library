<?php

namespace App\Http\Requests;

use App\Models\RegisteredVisitor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkDestroyArchivedRegisteredVisitorsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'visitor_ids' => ['required', 'array', 'min:1'],
            'visitor_ids.*' => ['integer', Rule::exists('registered_visitors', 'id')->whereNotNull('deleted_at')],
            'type' => ['required', Rule::in([RegisteredVisitor::TYPE_STUDENT, RegisteredVisitor::TYPE_EMPLOYEE])],
        ];
    }
}

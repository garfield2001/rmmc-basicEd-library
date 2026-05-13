<?php

namespace App\Http\Requests;

use App\Models\RegisteredVisitor;
use App\Services\Library\RegisteredVisitorTableService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CopyRegisteredVisitorColumnsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'columns' => ['required', 'array', 'min:1'],
            'columns.*' => ['string', Rule::in(RegisteredVisitorTableService::COPY_COLUMNS)],
            'type' => ['required', Rule::in([RegisteredVisitor::TYPE_STUDENT, RegisteredVisitor::TYPE_EMPLOYEE])],
            'search' => ['nullable', 'string', 'max:255'],
            'year_level' => ['nullable', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'string', 'max:255'],
            'direction' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
        ];
    }

    /**
     * @return array<int, string>
     */
    public function uniqueColumns(): array
    {
        return collect($this->validated('columns'))
            ->unique()
            ->values()
            ->all();
    }
}

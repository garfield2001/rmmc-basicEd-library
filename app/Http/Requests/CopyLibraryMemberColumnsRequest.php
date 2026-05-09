<?php

namespace App\Http\Requests;

use App\Models\LibraryMember;
use App\Services\Library\LibraryMemberTableService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CopyLibraryMemberColumnsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'columns' => ['required', 'array', 'min:1'],
            'columns.*' => ['string', Rule::in(LibraryMemberTableService::COPY_COLUMNS)],
            'type' => ['required', Rule::in([LibraryMember::TYPE_STUDENT, LibraryMember::TYPE_EMPLOYEE])],
            'search' => ['nullable', 'string', 'max:255'],
            'year_level' => ['nullable', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:255'],
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

<?php

namespace App\Http\Requests;

use App\Models\LibraryMember;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkDestroyLibraryMembersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'select_all' => ['sometimes', 'boolean'],
            'member_ids' => [
                Rule::excludeIf(fn (): bool => $this->boolean('select_all')),
                Rule::requiredIf(fn (): bool => ! $this->boolean('select_all')),
                'array',
                'min:1',
            ],
            'member_ids.*' => ['integer', 'distinct', Rule::exists('library_members', 'id')->whereNull('deleted_at')],
            'type' => ['required', Rule::in([LibraryMember::TYPE_STUDENT, LibraryMember::TYPE_EMPLOYEE])],
            'search' => ['nullable', 'string', 'max:255'],
            'year_level' => ['nullable', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:255'],
        ];
    }
}

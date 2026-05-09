<?php

namespace App\Http\Requests;

use App\Models\LibraryMember;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkDestroyArchivedLibraryMembersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'member_ids' => ['required', 'array', 'min:1'],
            'member_ids.*' => ['integer', Rule::exists('library_members', 'id')->whereNotNull('deleted_at')],
            'type' => ['required', Rule::in([LibraryMember::TYPE_STUDENT, LibraryMember::TYPE_EMPLOYEE])],
        ];
    }
}

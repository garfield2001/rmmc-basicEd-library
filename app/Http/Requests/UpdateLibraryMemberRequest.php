<?php

namespace App\Http\Requests;

use App\Models\LibraryMember;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLibraryMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $visitorId = $this->route('registered_visitor')?->id;

        return [
            'rfid_uid' => ['nullable', 'string', 'regex:/^\d{10}$/', Rule::unique('library_members', 'rfid_uid')->ignore($visitorId)],
            'school_id' => ['nullable', 'string', 'max:255', Rule::unique('library_members', 'school_id')->ignore($visitorId)],
            'type' => ['required', Rule::in([LibraryMember::TYPE_STUDENT, LibraryMember::TYPE_EMPLOYEE])],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'photo_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'year_level' => ['required_if:type,student', 'nullable', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:255'],
            'department' => ['required_if:type,employee', 'nullable', 'string', 'max:255'],
            'confirm_merge_duplicates' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'rfid_uid.unique' => 'This RFID Unique ID is already assigned to another registered visitor.',
            'school_id.unique' => 'This School ID is already assigned to another registered visitor.',
        ];
    }
}

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
        $memberId = $this->route('member')?->id;

        return [
            'rfid_uid' => ['required', 'string', 'regex:/^\d{10}$/', Rule::unique('library_members', 'rfid_uid')->ignore($memberId)],
            'school_id' => ['required', 'string', 'max:255', Rule::unique('library_members', 'school_id')->ignore($memberId)],
            'type' => ['required', Rule::in([LibraryMember::TYPE_STUDENT, LibraryMember::TYPE_EMPLOYEE])],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'photo_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_active' => ['boolean'],
            'year_level' => ['required_if:type,student', 'nullable', 'string', 'max:255'],
            'section' => ['nullable', 'string', 'max:255'],
            'department' => ['required_if:type,employee', 'nullable', 'string', 'max:255'],
        ];
    }
}

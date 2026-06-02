<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ImportLibraryMembersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'visitors_file' => ['required', 'file', 'max:5120', 'mimes:csv,txt,tsv,xls,xlsx,xlsm,docx,pdf'],
        ];
    }
}

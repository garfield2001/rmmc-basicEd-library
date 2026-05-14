<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ImportRegisteredVisitorsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'visitors_file' => ['required', 'file', 'max:5120'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $file = $this->file('visitors_file');

                if (! $file) {
                    return;
                }

                $extension = strtolower($file->getClientOriginalExtension());

                if (! in_array($extension, ['csv', 'txt', 'xls'], true)) {
                    $validator->errors()->add('visitors_file', 'Upload a CSV file or an Excel file exported from this app.');
                }
            },
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ScanTargetSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
        ];
    }
}

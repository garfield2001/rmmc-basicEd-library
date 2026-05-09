<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLibraryScanSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'repeat_scan_interval_hours' => ['required', 'integer', 'min:1', 'max:24'],
            'scan_starts_at' => ['required', 'date_format:H:i'],
            'scan_ends_at' => ['required', 'date_format:H:i', 'different:scan_starts_at'],
        ];
    }
}

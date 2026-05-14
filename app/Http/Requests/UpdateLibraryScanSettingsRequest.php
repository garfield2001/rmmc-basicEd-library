<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLibraryScanSettingsRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (! $this->has('repeat_scan_interval_hours') && $this->has('repeat_scan_interval_minutes')) {
            $this->merge([
                'repeat_scan_interval_hours' => max(1, (int) ceil($this->integer('repeat_scan_interval_minutes') / 60)),
            ]);
        }
    }

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
            'success_modal_close_seconds' => ['required', 'integer', 'min:1', 'max:60'],
            'error_modal_close_seconds' => ['required', 'integer', 'min:1', 'max:60'],
            'scanner_cooldown_seconds' => ['required', 'integer', 'min:0', 'max:60'],
        ];
    }
}

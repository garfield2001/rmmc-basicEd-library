<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLibraryVisitRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'rfid_uid' => is_string($this->rfid_uid) ? trim($this->rfid_uid) : $this->rfid_uid,
        ]);
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rfid_uid' => ['required', 'string', 'max:255'],
        ];
    }
}

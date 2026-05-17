<?php

namespace App\Http\Requests;

use App\Models\SchoolYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreSchoolYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:32', Rule::unique('school_years', 'name')],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'student_required_visits' => ['required', 'integer', 'min:0', 'max:255'],
            'employee_required_visits' => ['required', 'integer', 'min:0', 'max:255'],
            'transfer_employees' => ['sometimes', 'boolean'],
            'make_active' => ['sometimes', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('starts_at') || $validator->errors()->has('ends_at')) {
                    return;
                }

                $startsAt = Carbon::parse($this->input('starts_at'))->toDateString();
                $endsAt = Carbon::parse($this->input('ends_at'))->toDateString();
                $overlappingSchoolYear = SchoolYear::query()
                    ->whereDate('starts_at', '<=', $endsAt)
                    ->whereDate('ends_at', '>=', $startsAt)
                    ->first();

                if ($overlappingSchoolYear) {
                    $validator->errors()->add(
                        'starts_at',
                        "This school year overlaps {$overlappingSchoolYear->name} ({$this->displayDate($overlappingSchoolYear->starts_at)} to {$this->displayDate($overlappingSchoolYear->ends_at)}).",
                    );

                    return;
                }

                $latestSchoolYear = SchoolYear::query()
                    ->orderByDesc('ends_at')
                    ->first();

                if ($latestSchoolYear && Carbon::parse($startsAt)->lte($latestSchoolYear->ends_at)) {
                    $validator->errors()->add(
                        'starts_at',
                        "The next school year must start after {$latestSchoolYear->name} ends ({$this->displayDate($latestSchoolYear->ends_at)}).",
                    );
                }
            },
        ];
    }

    protected function prepareForValidation(): void
    {
        $startsAt = $this->parseDateInput($this->input('starts_at'));
        $endsAt = $this->parseDateInput($this->input('ends_at'));

        $this->merge([
            'starts_at' => $startsAt?->toDateString() ?? $this->input('starts_at'),
            'ends_at' => $endsAt?->toDateString() ?? $this->input('ends_at'),
        ]);

        if (! $startsAt || ! $endsAt) {
            return;
        }

        $this->merge([
            'name' => $startsAt->year.'-'.$endsAt->year,
            'make_active' => true,
        ]);
    }

    private function displayDate(Carbon $date): string
    {
        return $date->format('M-d-Y');
    }

    private function parseDateInput(mixed $value): ?Carbon
    {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        $normalized = preg_replace('/\s+/', ' ', str_replace(',', ' ', $value)) ?: $value;

        if (preg_match('/^(\d{1,2})\s+(\d{1,2})\s+(\d{4})$/', $normalized, $matches)) {
            try {
                return Carbon::createFromFormat('!m/d/Y', "{$matches[1]}/{$matches[2]}/{$matches[3]}");
            } catch (\Throwable) {
                return null;
            }
        }

        try {
            return Carbon::parse($normalized);
        } catch (\Throwable) {
            return null;
        }
    }
}

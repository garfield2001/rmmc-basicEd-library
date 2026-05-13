<?php

namespace App\Http\Requests;

use App\Models\SchoolYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateSchoolYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $schoolYearId = $this->route('schoolYear')?->id;

        return [
            'name' => ['required', 'string', 'max:32', Rule::unique('school_years', 'name')->ignore($schoolYearId)],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'minimum_visits' => ['required', 'integer', 'min:0', 'max:255'],
            'target_visits' => ['required', 'integer', 'min:0', 'max:255', 'gte:minimum_visits'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('starts_at') || $validator->errors()->has('ends_at')) {
                    return;
                }

                $schoolYearId = $this->route('schoolYear')?->id;
                $startsAt = Carbon::parse($this->input('starts_at'))->toDateString();
                $endsAt = Carbon::parse($this->input('ends_at'))->toDateString();

                $overlappingSchoolYear = SchoolYear::withTrashed()
                    ->whereKeyNot($schoolYearId)
                    ->whereDate('starts_at', '<=', $endsAt)
                    ->whereDate('ends_at', '>=', $startsAt)
                    ->first();

                if ($overlappingSchoolYear) {
                    $validator->errors()->add(
                        'starts_at',
                        "This school year overlaps {$overlappingSchoolYear->name} ({$this->displayDate($overlappingSchoolYear->starts_at)} to {$this->displayDate($overlappingSchoolYear->ends_at)}).",
                    );
                }
            },
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('starts_at') || ! $this->filled('ends_at')) {
            return;
        }

        $this->merge([
            'name' => Carbon::parse($this->input('starts_at'))->year.'-'.Carbon::parse($this->input('ends_at'))->year,
        ]);
    }

    private function displayDate(Carbon $date): string
    {
        return $date->format('M-d-Y');
    }
}

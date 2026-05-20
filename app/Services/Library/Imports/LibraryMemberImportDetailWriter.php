<?php

namespace App\Services\Library\Imports;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Support\Names\PersonName;

class LibraryMemberImportDetailWriter
{
    /**
     * @param  array<string, string>  $row
     */
    public function sync(LibraryMember $visitor, array $row, ?SchoolYear $schoolYear): void
    {
        if (! $schoolYear) {
            return;
        }

        if ($visitor->type === LibraryMember::TYPE_EMPLOYEE) {
            $this->syncEmployee($visitor, $row, $schoolYear);

            return;
        }

        $this->syncStudent($visitor, $row, $schoolYear);
    }

    private function syncEmployee(LibraryMember $visitor, array $row, SchoolYear $schoolYear): void
    {
        $current = $visitor->employeeSchoolYearRecords()->forSchoolYear($schoolYear->id)->first();
        $department = $this->mergedOptionalText($current?->department, $row['department'] ?? '') ?? 'Unassigned';

        $visitor->employeeSchoolYearRecords()->updateOrCreate(
            ['school_year_id' => $schoolYear->id],
            $this->visitorSnapshot($visitor) + ['department' => $department],
        );
    }

    private function syncStudent(LibraryMember $visitor, array $row, SchoolYear $schoolYear): void
    {
        $current = $visitor->studentSchoolYearRecords()->forSchoolYear($schoolYear->id)->first();
        $yearLevel = $this->mergedOptionalText($current?->year_level, $row['year_level'] ?? '');

        if (! $yearLevel) {
            return;
        }

        $sectionName = $this->mergedOptionalText($current?->section, $row['section'] ?? '');
        $section = $sectionName ? SchoolYearSection::query()->firstOrCreate([
            'school_year_id' => $schoolYear->id,
            'year_level' => $yearLevel,
            'name' => $sectionName,
        ]) : null;

        $visitor->studentSchoolYearRecords()->updateOrCreate(
            ['school_year_id' => $schoolYear->id],
            $this->visitorSnapshot($visitor) + [
                'school_year_section_id' => $section?->id,
                'year_level' => $yearLevel,
                'section' => $sectionName,
            ],
        );
    }

    private function mergedOptionalText(?string $current, ?string $incoming): ?string
    {
        $incoming = $this->optionalText($incoming ?? '');
        $current = PersonName::part($this->filledOrNull($current ?? ''));

        if ($incoming === '') {
            return $current;
        }

        if ($this->isMiddleInitial($incoming) && $current && str_starts_with(mb_strtolower($current), mb_strtolower(rtrim($incoming, '.')))) {
            return $current;
        }

        return PersonName::part($incoming);
    }

    private function optionalText(string $value): string
    {
        return trim(preg_replace('/[\s\x{00A0}]+/u', ' ', $value) ?: '');
    }

    private function filledOrNull(?string $value): ?string
    {
        $value = $this->optionalText($value ?? '');

        return $value === '' ? null : $value;
    }

    private function isMiddleInitial(string $value): bool
    {
        return preg_match('/^[A-Za-z]\.?$/', trim($value)) === 1;
    }

    private function visitorSnapshot(LibraryMember $visitor): array
    {
        return [
            'school_id' => $visitor->school_id,
            'rfid_uid' => $visitor->rfid_uid,
            'first_name' => $visitor->first_name,
            'middle_name' => $visitor->middle_name,
            'last_name' => $visitor->last_name,
            'photo' => $visitor->photo,
        ];
    }
}

<?php

namespace App\Services\Library\Imports;

use Illuminate\Support\Str;

class LibraryMemberImportHeaderRules
{
    public function normalize(string $header): string
    {
        return Str::of($header)
            ->lower()
            ->replace(['#', '/'], ' ')
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_')
            ->toString();
    }

    public function applyAliases(array $row): array
    {
        foreach ($this->aliases() as $alias => $canonical) {
            if (($row[$canonical] ?? '') === '' && ($row[$alias] ?? '') !== '') {
                $row[$canonical] = $row[$alias];
            }
        }

        return $row;
    }

    public function hasDisallowedSingleNameColumn(array $row): bool
    {
        foreach (array_keys($row) as $header) {
            if ($this->isAllowedNameHeader($header)) {
                continue;
            }

            if ($this->isDisallowedNameHeader($header)) {
                return true;
            }
        }

        return false;
    }

    private function aliases(): array
    {
        return [
            'student_no' => 'school_id',
            'student_id' => 'school_id',
            'student_number' => 'school_id',
            'school_id_no' => 'school_id',
            'school_id_number' => 'school_id',
            'student_id_no' => 'school_id',
            'employee_id' => 'school_id',
            'employee_no' => 'school_id',
            'rfid' => 'rfid_uid',
            'rfid_id' => 'rfid_uid',
            'rfid_unique_id' => 'rfid_uid',
            'uid' => 'rfid_uid',
            'grade' => 'year_level',
            'grade_level' => 'year_level',
            'year' => 'year_level',
            'level' => 'year_level',
            'strand_section' => 'section',
            'first' => 'first_name',
            'given_name' => 'first_name',
            'given_names' => 'first_name',
            'forename' => 'first_name',
            'middle' => 'middle_name',
            'middle_initial' => 'middle_name',
            'surname' => 'last_name',
            'family_name' => 'last_name',
        ];
    }

    private function isAllowedNameHeader(string $header): bool
    {
        return in_array($header, ['first_name', 'given_name', 'middle_name', 'last_name', 'surname'], true);
    }

    private function isDisallowedNameHeader(string $header): bool
    {
        return $header === 'name'
            || str_starts_with($header, 'name_of_')
            || str_contains($header, 'full_name')
            || str_contains($header, 'complete_name')
            || (str_contains($header, 'full') && str_contains($header, 'name'))
            || in_array($header, ['student_name', 'employee_name', 'visitor_name', 'member_name'], true);
    }
}

<?php

namespace App\Services\Library\Imports;

use App\Models\LibraryMember;
use App\Support\Names\PersonName;

class LibraryMemberImportRowNormalizer
{
    public function __construct(private readonly LibraryMemberImportHeaderRules $headers) {}

    public function normalize(array $row): array
    {
        $row = collect($row)
            ->mapWithKeys(fn ($value, $key) => [$this->normalizeHeader((string) $key) => trim((string) $value)])
            ->all();

        $row['_has_disallowed_single_name_column'] = $this->headers->hasDisallowedSingleNameColumn($row) ? '1' : '0';
        $row = $this->headers->applyAliases($row);
        $row['_has_required_name_columns'] = $this->hasRequiredNameColumns($row) ? '1' : '0';
        $row['_has_school_id_column'] = array_key_exists('school_id', $row) ? '1' : '0';
        $row['_school_id_raw'] = $this->optionalText($row['school_id'] ?? '');
        $row['_rfid_uid_raw'] = $this->optionalText($row['rfid_uid'] ?? '');

        $row['type'] = $this->visitorTypeForRow($row);
        $row['school_id'] = $this->normalizeSchoolId($row['school_id'] ?? '');
        $row['_has_valid_school_id'] = ($row['_school_id_raw'] ?? '') === '' || $row['school_id'] !== '' ? '1' : '0';
        $row['rfid_uid'] = $this->normalizeRFIDUid($row['rfid_uid'] ?? '');
        $row['first_name'] = PersonName::requiredPart($row['first_name'] ?? '');
        $row['middle_name'] = PersonName::part($row['middle_name'] ?? null) ?? '';
        $row['last_name'] = PersonName::requiredPart($row['last_name'] ?? '');

        if (($row['year_level'] ?? '') !== '') {
            $row['year_level'] = $this->normalizeYearLevel($row['year_level']);
        }

        return $row;
    }

    public function normalizeHeader(string $header): string
    {
        return $this->headers->normalize($header);
    }

    public function normalizeRFIDUid(string $value): string
    {
        $digits = preg_replace('/\D+/', '', $value) ?: '';

        return preg_match('/^\d{10}$/', $digits) ? $digits : '';
    }

    public function hasMinimumVisitorData(array $row): bool
    {
        if (! in_array($row['type'] ?? '', [LibraryMember::TYPE_STUDENT, LibraryMember::TYPE_EMPLOYEE], true)) {
            return false;
        }

        return ($row['_has_disallowed_single_name_column'] ?? '') !== '1'
            && ($row['_has_required_name_columns'] ?? '') === '1'
            && ($row['_has_school_id_column'] ?? '') === '1'
            && ($row['_has_valid_school_id'] ?? '') === '1'
            && ($row['first_name'] ?? '') !== ''
            && ($row['last_name'] ?? '') !== ''
            && ($row['school_id'] ?? '') !== '';
    }

    public function minimumVisitorDataMessage(array $row): string
    {
        if (($row['_has_disallowed_single_name_column'] ?? '') === '1') {
            return 'Full-name columns are not accepted. Use separate First Name, Middle Name, and Last Name columns.';
        }

        if (($row['_has_required_name_columns'] ?? '') !== '1') {
            return 'Import rows must include separate First/Given Name and Last Name columns. Middle Name is optional and may be blank.';
        }

        if (($row['_has_school_id_column'] ?? '') !== '1') {
            return 'A School ID column is required. Use a column named School ID or ID only; LRN and other ID columns are ignored.';
        }

        if (($row['_has_valid_school_id'] ?? '') !== '1') {
            return 'School ID must be exactly 10 digits. LRN values are not accepted as School ID.';
        }

        if (($row['school_id'] ?? '') === '') {
            return 'School ID is required.';
        }

        return 'First Name, Last Name, and School ID are required. Middle Name is optional.';
    }

    private function normalizeSchoolId(string $value): string
    {
        $digits = preg_replace('/\D+/', '', $value) ?: '';

        return preg_match('/^\d{10}$/', $digits) ? $digits : '';
    }

    private function normalizeYearLevel(string $yearLevel): string
    {
        $value = strtolower(trim($yearLevel));

        if (preg_match('/(?:grade|g|gr|gradfe)?\s*(\d{1,2})/', $value, $matches)) {
            return 'Grade '.(int) $matches[1];
        }

        return $this->optionalText($yearLevel);
    }

    private function optionalText(string $value): string
    {
        return trim(preg_replace('/\s+/', ' ', $value) ?? '');
    }

    private function visitorTypeForRow(array $row): string
    {
        $type = strtolower($row['type'] ?? $row['visitor_type'] ?? '');

        if (str_contains($type, 'employee') || str_contains($type, 'staff') || str_contains($type, 'faculty')) {
            return LibraryMember::TYPE_EMPLOYEE;
        }

        if (str_contains($type, 'student')) {
            return LibraryMember::TYPE_STUDENT;
        }

        return ($row['department'] ?? '') !== '' ? LibraryMember::TYPE_EMPLOYEE : LibraryMember::TYPE_STUDENT;
    }

    private function hasRequiredNameColumns(array $row): bool
    {
        return array_key_exists('first_name', $row) && array_key_exists('last_name', $row);
    }

}

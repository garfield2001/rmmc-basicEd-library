<?php

namespace App\Services\Library\Imports;

use App\Models\LibraryMember;
use Illuminate\Support\Str;

class LibraryMemberRosterRowParser
{
    public function __construct(private readonly LibraryMemberImportRowNormalizer $rows) {}

    /**
     * @param  array<int, array<int, string>>  $sheetRows
     * @param  array{year_level: string, section: string|null}|null  $classGroup
     * @return array<int, array<string, string>>
     */
    public function headerRowsFromValues(array $sheetRows, ?array $classGroup = null): array
    {
        $headers = [];
        $rows = [];

        foreach ($sheetRows as $values) {
            if ($headers === []) {
                $headers = array_map(fn ($header) => $this->rows->normalizeHeader($header), $values);

                continue;
            }

            $row = array_combine($headers, array_pad($values, count($headers), '')) ?: [];

            if ($classGroup) {
                $row['year_level'] = ($row['year_level'] ?? '') !== '' ? $row['year_level'] : $classGroup['year_level'];
                $row['section'] = ($row['section'] ?? '') !== '' ? $row['section'] : ($classGroup['section'] ?? '');
            }

            $rows[] = $row;
        }

        return $rows;
    }

    /**
     * @param  array<int, array<int, string>>  $rows
     * @param  array{year_level: string, section: string|null}|null  $classGroup
     * @return array<int, array<string, string>>
     */
    public function rosterRowsFromValues(array $rows, ?array $classGroup): array
    {
        if (! $classGroup) {
            return [];
        }

        $headers = [];
        $parsedRows = [];

        foreach ($rows as $values) {
            $values = array_map(fn ($value) => $this->cleanImportedText((string) $value), $values);
            $normalizedHeaders = array_map(fn ($header) => $this->rows->normalizeHeader($header), $values);

            if ($this->isStrictRosterHeaderRow($normalizedHeaders)) {
                $headers = $normalizedHeaders;

                continue;
            }

            if ($headers === []) {
                continue;
            }

            $row = array_combine($headers, array_pad($values, count($headers), '')) ?: [];
            $studentRow = $this->studentRowFromAssociativeValues($this->rows->normalize($row), $classGroup);

            if ($studentRow) {
                $parsedRows[] = $studentRow;
            }
        }

        return $parsedRows;
    }

    /**
     * @param  array<string, string|null>  $values
     * @param  array{year_level: string, section: string|null}  $classGroup
     * @return array<string, string>|null
     */
    public function studentRowFromAssociativeValues(array $values, array $classGroup): ?array
    {
        if (! array_key_exists('first_name', $values) || ! array_key_exists('last_name', $values)) {
            return null;
        }

        $lastName = $this->cleanNamePart($values['last_name'] ?? '');
        $firstName = $this->cleanNamePart($values['first_name'] ?? '');
        $middleName = $this->cleanNamePart($values['middle_name'] ?? '');

        if (! $lastName || ! $firstName || $this->isRosterLabel($lastName) || $this->isRosterLabel($firstName)) {
            return null;
        }

        return [
            'school_id' => $this->cleanImportedText((string) ($values['school_id'] ?? '')),
            'rfid_uid' => $this->rows->normalizeRFIDUid((string) ($values['rfid_uid'] ?? '')),
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => $firstName,
            'middle_name' => $middleName ?? '',
            'last_name' => $lastName,
            'year_level' => $classGroup['year_level'],
            'section' => $classGroup['section'] ?? '',
            'department' => $this->cleanImportedText((string) ($values['department'] ?? '')),
        ];
    }

    public function isRosterLabel(string $value): bool
    {
        return in_array(strtoupper(trim($value)), ['LAST NAME', 'FIRST NAME', 'MIDDLE NAME', 'SURNAME', 'MALE', 'FEMALE', 'LRN'], true);
    }

    public function isSchoolIdHeader(string $header): bool
    {
        return in_array($header, ['school_id', 'id'], true);
    }

    private function cleanNamePart(?string $value): ?string
    {
        $value = $this->cleanImportedText((string) $value);

        if ($value === '' || $value === '-') {
            return null;
        }

        return Str::of($value)->replaceMatches('/\s+/', ' ')->trim()->toString();
    }

    private function cleanImportedText(string $value): string
    {
        return trim(preg_replace('/[\s\x{00A0}]+/u', ' ', $value) ?: '');
    }

    /**
     * @param  array<int, string>  $headers
     */
    private function isStrictRosterHeaderRow(array $headers): bool
    {
        $hasFirstName = in_array('first_name', $headers, true) || in_array('given_name', $headers, true);
        $hasLastName = in_array('last_name', $headers, true) || in_array('surname', $headers, true);
        $hasSchoolId = collect($headers)->contains(fn (string $header) => $this->isSchoolIdHeader($header));

        return $hasFirstName && $hasLastName && $hasSchoolId;
    }
}

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
        $headerIndex = null;

        foreach ($sheetRows as $idx => $values) {
            $candidateHeaders = array_map(fn ($header) => $this->rows->normalizeHeader((string) $header), $values);

            if ($this->isHeaderRowCandidate($candidateHeaders)) {
                $headerIndex = $idx;
                $headers = $candidateHeaders;

                break;
            }
        }

        if ($headerIndex === null) {
            foreach ($sheetRows as $idx => $values) {
                if (count(array_filter($values, fn ($v) => trim((string) $v) !== '')) > 0) {
                    $headerIndex = $idx;
                    $headers = array_map(fn ($header) => $this->rows->normalizeHeader((string) $header), $values);

                    break;
                }
            }
        }

        if ($headerIndex === null || $headers === []) {
            return [];
        }

        for ($i = $headerIndex + 1; $i < count($sheetRows); $i++) {
            $values = $sheetRows[$i];

            if (count(array_filter($values, fn ($value) => trim((string) $value) !== '')) === 0) {
                continue;
            }

            $sliced = array_slice($values, 0, count($headers));
            $padded = array_pad(array_map('strval', $sliced), count($headers), '');
            $row = array_combine($headers, $padded) ?: [];

            if ($classGroup) {
                if (! empty($classGroup['year_level'])) {
                    $row['year_level'] = ($row['year_level'] ?? '') !== '' ? $row['year_level'] : $classGroup['year_level'];
                }
                if (! empty($classGroup['section'])) {
                    $row['section'] = ($row['section'] ?? '') !== '' ? $row['section'] : $classGroup['section'];
                }
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

        $yearLevel = ($classGroup['year_level'] ?? '') !== '' ? $classGroup['year_level'] : (string) ($values['year_level'] ?? '');
        $section = ($classGroup['section'] ?? '') !== '' ? $classGroup['section'] : (string) ($values['section'] ?? '');

        return [
            'school_id' => $this->cleanImportedText((string) ($values['school_id'] ?? '')),
            'rfid_uid' => $this->rows->normalizeRFIDUid((string) ($values['rfid_uid'] ?? '')),
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => $firstName,
            'middle_name' => $middleName ?? '',
            'last_name' => $lastName,
            'year_level' => $yearLevel,
            'section' => $section,
            'department' => $this->cleanImportedText((string) ($values['department'] ?? '')),
        ];
    }

    public function isRosterLabel(string $value): bool
    {
        return in_array(strtoupper(trim($value)), ['LAST NAME', 'FIRST NAME', 'MIDDLE NAME', 'SURNAME', 'MALE', 'FEMALE', 'LRN'], true);
    }

    public function isSchoolIdHeader(string $header): bool
    {
        return in_array($header, [
            'school_id',
            'student_no',
            'student_id',
            'student_number',
            'school_id_no',
            'school_id_number',
            'student_id_no',
            'employee_id',
            'employee_no',
        ], true);
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

    /**
     * @param  array<int, string>  $headers
     */
    private function isHeaderRowCandidate(array $headers): bool
    {
        $hasFirstName = in_array('first_name', $headers, true) || in_array('given_name', $headers, true) || in_array('first', $headers, true);
        $hasLastName = in_array('last_name', $headers, true) || in_array('surname', $headers, true) || in_array('last', $headers, true);
        $hasSchoolId = collect($headers)->contains(fn (string $header) => $this->isSchoolIdHeader($header));

        if ($hasFirstName && $hasLastName) {
            return true;
        }

        if ($hasSchoolId && ($hasFirstName || $hasLastName)) {
            return true;
        }

        return false;
    }
}

<?php

namespace App\Services\Library\Imports;

class LibraryMemberPdfRosterReader
{
    public function __construct(
        private readonly LibraryMemberClassGroupParser $classGroups,
        private readonly LibraryMemberImportRowNormalizer $rows,
        private readonly LibraryMemberPdfTextExtractor $text,
        private readonly LibraryMemberRosterRowParser $roster,
    ) {}

    /**
     * @return array<int, array<string, string>>
     */
    public function read(string $path): array
    {
        $content = file_get_contents($path);

        if (! is_string($content)) {
            return [];
        }

        $rows = [];
        $classGroup = null;
        $headerMap = null;

        foreach ($this->text->lines($content) as $line) {
            if ($candidateGroup = $this->classGroups->fromText($line)) {
                $classGroup = $candidateGroup;
                $headerMap = null;

                continue;
            }

            if (preg_match('/\b(LAST\s*NAME|SURNAME|GIVEN\s*NAME|FIRST\s*NAME|MIDDLE\s*NAME|STUDENT\s*NO|STUDENT\s*ID|LRN|RFID|SCHOOL\s*ID|ID|YEAR\s*LEVEL|GRADE|SECTION|DEPARTMENT)\b/i', $line)) {
                $headerMap = $this->headerMap($line);

                continue;
            }

            if ($this->roster->isRosterLabel($line)) {
                continue;
            }

            $row = $this->rosterRow($line, $classGroup, $headerMap);

            if ($row) {
                $rows[] = $row;
            }
        }

        return $rows;
    }

    /**
     * @return array<string, int>
     */
    private function headerMap(string $line): array
    {
        $map = [];

        foreach (preg_split('/\s{2,}|\t+/', trim($line)) ?: [] as $index => $header) {
            $normalized = $this->rows->normalizeHeader($header);

            if (in_array($normalized, ['surname', 'last_name'], true)) {
                $map['last_name'] = $index;
            } elseif (in_array($normalized, ['given_name', 'first_name'], true)) {
                $map['first_name'] = $index;
            } elseif ($normalized === 'middle_name') {
                $map['middle_name'] = $index;
            } elseif ($this->roster->isSchoolIdHeader($normalized)) {
                $map['school_id'] = $index;
            } elseif (str_contains($normalized, 'rfid')) {
                $map['rfid_uid'] = $index;
            } elseif (in_array($normalized, ['year_level', 'grade_level', 'grade'], true)) {
                $map['year_level'] = $index;
            } elseif ($normalized === 'section') {
                $map['section'] = $index;
            } elseif ($normalized === 'department') {
                $map['department'] = $index;
            }
        }

        return $map;
    }

    /**
     * @param  array{year_level: string, section: string|null}|null  $classGroup
     * @param  array<string, int>|null  $headerMap
     * @return array<string, string>|null
     */
    private function rosterRow(string $line, ?array $classGroup, ?array $headerMap): ?array
    {
        if (! $headerMap || ! isset($headerMap['first_name'], $headerMap['last_name'])) {
            return null;
        }

        $columns = preg_split('/\s{2,}|\t+/', trim($line)) ?: [];
        $values = [];

        foreach ($headerMap as $field => $index) {
            $values[$field] = $columns[$index] ?? '';
        }

        $rowClassGroup = $classGroup;
        if (! $rowClassGroup && isset($values['year_level'])) {
            $rowClassGroup = [
                'year_level' => $values['year_level'],
                'section' => $values['section'] ?? null,
            ];
        }

        if (! $rowClassGroup) {
            return null;
        }

        return $this->roster->studentRowFromAssociativeValues($values, $rowClassGroup);
    }
}

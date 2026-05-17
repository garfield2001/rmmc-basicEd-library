<?php

namespace App\Services\Library;

use App\Models\LibraryVisit;
use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Support\Names\PersonName;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RegisteredVisitorImportService
{
    /**
     * @return array{created: int, updated: int, restored: int, visits: int, skipped: int}
     */
    public function import(UploadedFile $file): array
    {
        $rows = $this->readRows($file);

        return DB::transaction(function () use ($rows): array {
            $schoolYear = SchoolYear::active()->first();

            if (! $schoolYear) {
                throw ValidationException::withMessages([
                    'visitors_file' => 'Create or activate a school year before importing students or employees.',
                ]);
            }

            $summary = [
                'created' => 0,
                'updated' => 0,
                'restored' => 0,
                'visits' => 0,
                'skipped' => 0,
            ];

            foreach ($rows as $row) {
                $row = $this->normalizeRow($row);

                if (! $this->hasMinimumVisitorData($row)) {
                    $summary['skipped']++;

                    continue;
                }

                $visitor = $this->findVisitor($row, $schoolYear);

                if ($this->rowRejectionMessage($row, $visitor)) {
                    $summary['skipped']++;

                    continue;
                }

                if ($visitor) {
                    $this->fillMissingRfid($visitor, $row);
                    $summary['updated']++;

                    continue;
                }

                $visitor = $this->createVisitor($row);
                $this->syncVisitorDetails($visitor, $row, $schoolYear);

                if ($this->syncVisit($visitor, $row, $schoolYear)) {
                    $summary['visits']++;
                }

                $summary['created']++;
            }

            return $summary;
        });
    }

    /**
     * @return array{file_name: string, total_rows: int, importable_count: int, skipped_count: int, create_count: int, update_count: int, members: array<int, array<string, mixed>>, skipped: array<int, array<string, mixed>>}
     */
    public function preview(UploadedFile $file): array
    {
        $schoolYear = SchoolYear::active()->first();

        if (! $schoolYear) {
            throw ValidationException::withMessages([
                'visitors_file' => 'Create or activate a school year before importing students or employees.',
            ]);
        }

        $members = [];
        $skipped = [];

        foreach ($this->readRows($file) as $row) {
            $row = $this->normalizeRow($row);

            if (! $this->hasMinimumVisitorData($row)) {
                $skipped[] = [
                    'name' => trim(collect([$row['first_name'] ?? '', $row['middle_name'] ?? '', $row['last_name'] ?? ''])->filter()->implode(' ')) ?: 'Incomplete row',
                    'reason' => $this->minimumVisitorDataMessage($row),
                ];

                continue;
            }

            $visitor = $this->findVisitor($row, $schoolYear);

            if ($reason = $this->rowRejectionMessage($row, $visitor)) {
                $skipped[] = [
                    'name' => $this->previewName($row),
                    'reason' => $reason,
                ];

                continue;
            }

            $members[] = [
                'status' => $visitor ? 'rfid' : 'create',
                'type' => $row['type'],
                'name' => $this->previewName($row),
                'matched_name' => $visitor?->full_name,
                'school_id' => $row['school_id'] ?: null,
                'rfid_uid' => $row['rfid_uid'] ?: null,
                'year_level' => $row['type'] === RegisteredVisitor::TYPE_STUDENT ? ($row['year_level'] ?? null) : null,
                'section' => $row['type'] === RegisteredVisitor::TYPE_STUDENT ? ($row['section'] ?? null) : null,
                'department' => $row['type'] === RegisteredVisitor::TYPE_EMPLOYEE ? ($row['department'] ?? null) : null,
            ];
        }

        $createCount = collect($members)->where('status', 'create')->count();
        $updateCount = collect($members)->where('status', 'rfid')->count();

        return [
            'file_name' => $file->getClientOriginalName(),
            'total_rows' => count($members) + count($skipped),
            'importable_count' => count($members),
            'skipped_count' => count($skipped),
            'create_count' => $createCount,
            'update_count' => $updateCount,
            'members' => $members,
            'skipped' => $skipped,
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function readRows(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $path = $file->getRealPath();

        if ($extension === 'xls') {
            return $this->readHtmlTableRows((string) file_get_contents($path));
        }

        if (in_array($extension, ['xlsx', 'xlsm'], true)) {
            return $this->readXlsxRows((string) $path);
        }

        if ($extension === 'docx') {
            return $this->readDocxRows((string) $path);
        }

        if ($extension === 'pdf') {
            return $this->readPdfRows((string) $path);
        }

        return $this->readCsvRows($path, $extension === 'tsv' ? "\t" : ',');
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function readCsvRows(string $path, string $delimiter = ','): array
    {
        $handle = fopen($path, 'r');

        if (! $handle) {
            return [];
        }

        $headers = null;
        $rows = [];

        while (($data = fgetcsv($handle, separator: $delimiter)) !== false) {
            if ($headers === null) {
                $headers = array_map(fn ($header) => $this->normalizeHeader((string) $header), $data);

                continue;
            }

            if (count(array_filter($data, fn ($value) => trim((string) $value) !== '')) === 0) {
                continue;
            }

            $rows[] = array_combine($headers, array_pad(array_map('strval', $data), count($headers), '')) ?: [];
        }

        fclose($handle);

        return $rows;
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function readPdfRows(string $path): array
    {
        $content = file_get_contents($path);

        if (! is_string($content)) {
            return [];
        }

        $lines = $this->pdfTextLines($content);
        $rows = [];
        $classGroup = null;
        $headerMap = null;

        foreach ($lines as $line) {
            $candidateGroup = $this->classGroupFromText($line);

            if ($candidateGroup) {
                $classGroup = $candidateGroup;
                $headerMap = null;

                continue;
            }

            if (preg_match('/\b(LAST\s*NAME|SURNAME|GIVEN\s*NAME|FIRST\s*NAME|MIDDLE\s*NAME|LRN|RFID|SCHOOL\s*ID|EMPLOYEE\s*ID|DEPARTMENT)\b/i', $line)) {
                $headerMap = $this->pdfHeaderMap($line);

                continue;
            }

            if (! $classGroup || $this->isRosterLabel($line)) {
                continue;
            }

            $row = $this->pdfRosterRow($line, $classGroup, $headerMap);

            if ($row) {
                $rows[] = $row;
            }
        }

        return $rows;
    }

    /**
     * @return array<int, string>
     */
    private function pdfTextLines(string $content): array
    {
        $text = '';

        preg_match_all('/<<(.*?)>>\s*stream\s*(.*?)\s*endstream/s', $content, $streams, PREG_SET_ORDER);

        foreach ($streams as $stream) {
            $dictionary = $stream[1];
            $data = preg_replace('/^\r?\n|\r?\n$/', '', $stream[2]) ?? '';

            if (str_contains($dictionary, '/FlateDecode')) {
                $inflated = @gzuncompress($data);
                $data = is_string($inflated) ? $inflated : $data;
            }

            $text .= "\n".$this->pdfTextFromContentStream($data);
        }

        return collect(preg_split('/\R+/', $text) ?: [])
            ->map(fn (string $line) => trim(preg_replace('/[\x{00A0}]+/u', ' ', $line) ?: ''))
            ->filter()
            ->values()
            ->all();
    }

    private function pdfTextFromContentStream(string $stream): string
    {
        $text = '';

        preg_match_all('/\[(.*?)\]\s*TJ|\((?:\\\\.|[^\\\\()])*\)\s*Tj|<([0-9A-Fa-f\s]+)>\s*Tj|T\*|\'|"/s', $stream, $matches, PREG_SET_ORDER);

        foreach ($matches as $match) {
            $token = $match[0];

            if (in_array($token, ['T*', "'", '"'], true)) {
                $text .= "\n";

                continue;
            }

            if (str_ends_with($token, 'TJ')) {
                $text .= $this->pdfArrayText($match[1] ?? '')."\n";

                continue;
            }

            if (preg_match('/\((?:\\\\.|[^\\\\()])*\)\s*Tj/s', $token, $stringMatch)) {
                $text .= $this->pdfLiteralText($stringMatch[0])."\n";

                continue;
            }

            if (isset($match[2]) && $match[2] !== '') {
                $text .= $this->pdfHexText($match[2])."\n";
            }
        }

        return $text;
    }

    private function pdfArrayText(string $array): string
    {
        $text = '';

        preg_match_all('/\((?:\\\\.|[^\\\\()])*\)|<([0-9A-Fa-f\s]+)>/', $array, $parts);

        foreach ($parts[0] as $part) {
            $text .= str_starts_with($part, '<')
                ? $this->pdfHexText($part)
                : $this->pdfLiteralText($part);
        }

        return $text;
    }

    private function pdfLiteralText(string $literal): string
    {
        $literal = preg_replace('/\s*Tj$/', '', $literal) ?? $literal;
        $literal = trim($literal);
        $literal = preg_replace('/^\(|\)$/', '', $literal) ?? $literal;

        return stripcslashes($literal);
    }

    private function pdfHexText(string $hex): string
    {
        $hex = preg_replace('/[^0-9A-Fa-f]/', '', trim($hex, '<>')) ?? '';

        if ($hex === '') {
            return '';
        }

        $binary = hex2bin(strlen($hex) % 2 === 0 ? $hex : '0'.$hex);

        if (! is_string($binary)) {
            return '';
        }

        $utf16 = function_exists('mb_convert_encoding')
            ? @mb_convert_encoding($binary, 'UTF-8', 'UTF-16BE')
            : false;

        return is_string($utf16) && preg_match('/[[:print:]]/', $utf16) ? $utf16 : $binary;
    }

    /**
     * @return array<string, int>
     */
    private function pdfHeaderMap(string $line): array
    {
        $headers = preg_split('/\s{2,}|\t+/', trim($line)) ?: [];
        $map = [];

        foreach ($headers as $index => $header) {
            $normalized = $this->normalizeHeader($header);

            if (in_array($normalized, ['surname', 'last_name'], true)) {
                $map['last_name'] = $index;
            } elseif (in_array($normalized, ['given_name', 'first_name'], true)) {
                $map['first_name'] = $index;
            } elseif ($normalized === 'middle_name') {
                $map['middle_name'] = $index;
            } elseif (in_array($normalized, ['id_number', 'student_id', 'employee_id', 'school_id'], true)) {
                $map['school_id'] = $index;
            } elseif (str_contains($normalized, 'rfid')) {
                $map['rfid_uid'] = $index;
            } elseif ($normalized === 'department') {
                $map['department'] = $index;
            }
        }

        return $map;
    }

    /**
     * @param  array{year_level: string, section: string|null}  $classGroup
     * @param  array<string, int>|null  $headerMap
     * @return array<string, string>|null
     */
    private function pdfRosterRow(string $line, array $classGroup, ?array $headerMap): ?array
    {
        $columns = preg_split('/\s{2,}|\t+/', trim($line)) ?: [];

        if ($headerMap && isset($headerMap['first_name'], $headerMap['middle_name'], $headerMap['last_name'])) {
            $values = [];

            foreach ($headerMap as $field => $index) {
                $values[$field] = $columns[$index] ?? '';
            }

            return $this->studentRowFromAssociativeValues($values, $classGroup);
        }

        $withoutLeadingNumber = preg_replace('/^\s*\d+\s+/', '', $line) ?? $line;

        if (str_contains($withoutLeadingNumber, ',')) {
            return null;
        }

        if (count($columns) >= 3) {
            return $this->studentRowFromAssociativeValues([
                'last_name' => $columns[0] ?? '',
                'first_name' => $columns[1] ?? '',
                'middle_name' => $columns[2] ?? '',
                'school_id' => $columns[3] ?? '',
            ], $classGroup);
        }

        return null;
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function readHtmlTableRows(string $html): array
    {
        $previous = libxml_use_internal_errors(true);
        $document = new \DOMDocument;
        $document->loadHTML($html);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $headers = [];
        $rows = [];

        foreach ($document->getElementsByTagName('tr') as $trIndex => $row) {
            $cells = [];

            foreach (['th', 'td'] as $tag) {
                foreach ($row->getElementsByTagName($tag) as $cell) {
                    $cells[] = trim($cell->textContent);
                }
            }

            if ($trIndex === 0) {
                $headers = array_map(fn ($header) => $this->normalizeHeader($header), $cells);

                continue;
            }

            if ($headers === [] || count(array_filter($cells, fn ($value) => trim($value) !== '')) === 0) {
                continue;
            }

            $rows[] = array_combine($headers, array_pad($cells, count($headers), '')) ?: [];
        }

        return $rows;
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function readXlsxRows(string $path): array
    {
        $zip = new \ZipArchive;

        if ($zip->open($path) !== true) {
            return [];
        }

        $rows = [];
        $sharedStrings = $this->xlsxSharedStrings($zip);

        foreach ($this->xlsxSheetPaths($zip) as $sheetName => $sheetPath) {
            $sheetRows = $this->readXlsxSheetRows($zip, $sheetPath, $sharedStrings);
            $classGroup = $this->classGroupFromText($sheetName);
            $rosterRows = $this->rosterRowsFromValues($sheetRows, $classGroup);

            $rows = [
                ...$rows,
                ...($classGroup ? $rosterRows : $this->headerRowsFromValues($sheetRows)),
            ];
        }

        $zip->close();

        return $rows;
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function readDocxRows(string $path): array
    {
        $zip = new \ZipArchive;

        if ($zip->open($path) !== true) {
            return [];
        }

        $documentXml = $zip->getFromName('word/document.xml');
        $zip->close();

        if (! is_string($documentXml)) {
            return [];
        }

        $previous = libxml_use_internal_errors(true);
        $document = new \DOMDocument;
        $loaded = $document->loadXML($documentXml);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        if (! $loaded) {
            return [];
        }

        $xpath = new \DOMXPath($document);
        $xpath->registerNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');
        $body = $xpath->query('//w:body')->item(0);

        if (! $body) {
            return [];
        }

        $rows = [];
        $classGroup = null;

        foreach ($body->childNodes as $child) {
            if ($child->localName === 'p') {
                $candidateGroup = $this->classGroupFromText($this->domNodeText($child, $xpath));

                if ($candidateGroup) {
                    $classGroup = $candidateGroup;
                }

                continue;
            }

            if ($child->localName !== 'tbl' || ! $classGroup) {
                continue;
            }

            $tableRows = [];

            foreach ($xpath->query('./w:tr', $child) as $tableRow) {
                $values = [];

                foreach ($xpath->query('./w:tc', $tableRow) as $cell) {
                    $values[] = $this->domNodeText($cell, $xpath);
                }

                $tableRows[] = $values;
            }

            $rows = [
                ...$rows,
                ...$this->rosterRowsFromValues($tableRows, $classGroup),
            ];
        }

        return $rows;
    }

    /**
     * @return array<int, string>
     */
    private function xlsxSharedStrings(\ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');

        if (! is_string($xml)) {
            return [];
        }

        $shared = simplexml_load_string($xml);

        if (! $shared) {
            return [];
        }

        $strings = [];

        foreach ($shared->si as $item) {
            $text = '';

            if (isset($item->t)) {
                $text = (string) $item->t;
            } elseif (isset($item->r)) {
                foreach ($item->r as $run) {
                    $text .= (string) $run->t;
                }
            }

            $strings[] = $text;
        }

        return $strings;
    }

    /**
     * @return array<string, string>
     */
    private function xlsxSheetPaths(\ZipArchive $zip): array
    {
        $workbookXml = $zip->getFromName('xl/workbook.xml');
        $relationshipsXml = $zip->getFromName('xl/_rels/workbook.xml.rels');

        if (! is_string($workbookXml) || ! is_string($relationshipsXml)) {
            return [];
        }

        $workbook = simplexml_load_string($workbookXml);
        $relationships = simplexml_load_string($relationshipsXml);

        if (! $workbook || ! $relationships) {
            return [];
        }

        $workbook->registerXPathNamespace('main', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
        $relationshipTargets = [];

        foreach ($relationships->Relationship as $relationship) {
            $attributes = $relationship->attributes();
            $relationshipTargets[(string) $attributes['Id']] = (string) $attributes['Target'];
        }

        $paths = [];

        foreach ($workbook->xpath('//main:sheet') ?: [] as $sheet) {
            $attributes = $sheet->attributes();
            $relationshipAttributes = $sheet->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships');
            $target = $relationshipTargets[(string) $relationshipAttributes['id']] ?? null;

            if (! $target) {
                continue;
            }

            $paths[(string) $attributes['name']] = str_starts_with($target, '/')
                ? ltrim($target, '/')
                : 'xl/'.ltrim($target, '/');
        }

        return $paths;
    }

    /**
     * @param  array<int, string>  $sharedStrings
     * @return array<int, array<int, string>>
     */
    private function readXlsxSheetRows(\ZipArchive $zip, string $sheetPath, array $sharedStrings): array
    {
        $sheetXml = $zip->getFromName($sheetPath);

        if (! is_string($sheetXml)) {
            return [];
        }

        $xml = simplexml_load_string($sheetXml);

        if (! $xml) {
            return [];
        }

        $rows = [];

        foreach ($xml->sheetData->row as $row) {
            $cells = [];

            foreach ($row->c as $cell) {
                $reference = (string) $cell['r'];
                $columnIndex = $this->xlsxColumnIndex($reference);
                $type = (string) $cell['t'];
                $value = (string) $cell->v;

                if ($type === 's') {
                    $value = $sharedStrings[(int) $value] ?? '';
                }

                if ($type === 'inlineStr') {
                    $value = (string) $cell->is->t;
                }

                $cells[$columnIndex] = trim($value);
            }

            $values = $cells === []
                ? []
                : array_map('strval', array_replace(array_fill(0, max(array_keys($cells)) + 1, ''), $cells));

            if (count(array_filter($values, fn ($value) => trim($value) !== '')) > 0) {
                $rows[] = $values;
            }
        }

        return $rows;
    }

    /**
     * @param  array<int, array<int, string>>  $sheetRows
     * @return array<int, array<string, string>>
     */
    private function headerRowsFromValues(array $sheetRows): array
    {
        $headers = [];
        $rows = [];

        foreach ($sheetRows as $values) {
            if ($headers === []) {
                $headers = array_map(fn ($header) => $this->normalizeHeader($header), $values);

                continue;
            }

            $rows[] = array_combine($headers, array_pad($values, count($headers), '')) ?: [];
        }

        return $rows;
    }

    /**
     * @param  array<int, array<int, string>>  $rows
     * @param  array{year_level: string, section: string|null}|null  $classGroup
     * @return array<int, array<string, string>>
     */
    private function rosterRowsFromValues(array $rows, ?array $classGroup): array
    {
        if (! $classGroup) {
            return [];
        }

        return collect($rows)
            ->map(fn (array $values) => $this->studentRowFromRosterValues($values, $classGroup))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @param  array<int, string>  $values
     * @param  array{year_level: string, section: string|null}  $classGroup
     * @return array<string, string>|null
     */
    private function studentRowFromRosterValues(array $values, array $classGroup): ?array
    {
        $values = array_map(fn ($value) => $this->cleanImportedText((string) $value), $values);

        if (! array_key_exists(1, $values) || ! array_key_exists(2, $values) || ! array_key_exists(3, $values)) {
            return null;
        }

        $lastName = $this->cleanNamePart($values[1] ?? '');
        $firstName = $this->cleanNamePart($values[2] ?? '');
        $middleName = $this->cleanNamePart($values[3] ?? '');

        if (str_contains($values[1] ?? '', ',') || preg_match('/^\d{10,12}$/', $firstName ?? '')) {
            return null;
        }

        return $this->studentRowFromAssociativeValues([
            'school_id' => $values[5] ?? '',
            'rfid_uid' => $values[6] ?? '',
            'first_name' => $firstName,
            'middle_name' => $middleName ?? '',
            'last_name' => $lastName,
        ], $classGroup);
    }

    /**
     * @param  array<string, string|null>  $values
     * @param  array{year_level: string, section: string|null}  $classGroup
     * @return array<string, string>|null
     */
    private function studentRowFromAssociativeValues(array $values, array $classGroup): ?array
    {
        if (! array_key_exists('first_name', $values) || ! array_key_exists('middle_name', $values) || ! array_key_exists('last_name', $values)) {
            return null;
        }

        $lastName = $this->cleanNamePart($values['last_name'] ?? '');
        $firstName = $this->cleanNamePart($values['first_name'] ?? '');
        $middleName = $this->cleanNamePart($values['middle_name'] ?? '');

        if (! $lastName || ! $firstName || $this->isRosterLabel($lastName) || $this->isRosterLabel($firstName)) {
            return null;
        }

        return [
            'school_id' => $this->optionalText((string) ($values['school_id'] ?? '')),
            'rfid_uid' => $this->normalizeRFIDUid((string) ($values['rfid_uid'] ?? '')),
            'type' => RegisteredVisitor::TYPE_STUDENT,
            'first_name' => $firstName,
            'middle_name' => $middleName ?? '',
            'last_name' => $lastName,
            'year_level' => $classGroup['year_level'],
            'section' => $classGroup['section'] ?? '',
            'department' => $this->optionalText((string) ($values['department'] ?? '')),
        ];
    }

    private function cleanNamePart(?string $value): ?string
    {
        $value = $this->cleanImportedText((string) $value);

        if ($value === '' || $value === '-') {
            return null;
        }

        return Str::of($value)
            ->replaceMatches('/\s+/', ' ')
            ->trim()
            ->toString();
    }

    private function cleanImportedText(string $value): string
    {
        return trim(preg_replace('/[\s\x{00A0}]+/u', ' ', $value) ?: '');
    }

    private function isRosterLabel(string $value): bool
    {
        return in_array(strtoupper(trim($value)), ['LAST NAME', 'FIRST NAME', 'MIDDLE NAME', 'SURNAME', 'MALE', 'FEMALE', 'LRN'], true);
    }

    /**
     * @return array{year_level: string, section: string|null}|null
     */
    private function classGroupFromText(string $text): ?array
    {
        $tokens = preg_split('/[^\p{L}\p{N}]+/u', strtoupper($text), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $yearLevel = null;
        $skip = [];

        foreach ($tokens as $index => $token) {
            if (preg_match('/^KD([12])$/', $token, $matches) || preg_match('/^K([12])$/', $token, $matches)) {
                $yearLevel = 'Kindergarten '.$matches[1];
                $skip[$index] = true;

                break;
            }

            if (preg_match('/^G([1-9]|10)$/', $token, $matches)) {
                $yearLevel = 'Grade '.$matches[1];
                $skip[$index] = true;

                break;
            }

            if (in_array($token, ['KINDERGARTEN', 'KINDER', 'KD'], true) && preg_match('/^[12]$/', $tokens[$index + 1] ?? '')) {
                $yearLevel = 'Kindergarten '.$tokens[$index + 1];
                $skip[$index] = true;
                $skip[$index + 1] = true;

                break;
            }

            if ($this->looksLikeGradeToken($token) && preg_match('/^([1-9]|10)$/', $tokens[$index + 1] ?? '')) {
                $yearLevel = 'Grade '.$tokens[$index + 1];
                $skip[$index] = true;
                $skip[$index + 1] = true;

                break;
            }

            if ($index === 0 && preg_match('/^([1-9]|10)$/', $token)) {
                $yearLevel = 'Grade '.$token;
                $skip[$index] = true;

                break;
            }
        }

        if (! $yearLevel) {
            return null;
        }

        $sectionTokens = array_values(array_filter(
            $tokens,
            fn (string $token, int $index): bool => ! isset($skip[$index]) && ! in_array($token, ['CLASS', 'LIST', 'WITH', 'LRN'], true),
            ARRAY_FILTER_USE_BOTH,
        ));
        $section = Str::of(implode(' ', $sectionTokens))->lower()->title()->trim()->toString();

        return [
            'year_level' => $yearLevel,
            'section' => $section !== '' ? $section : null,
        ];
    }

    private function looksLikeGradeToken(string $token): bool
    {
        return $token === 'GRADE' || levenshtein($token, 'GRADE') <= 1;
    }

    private function normalizeYearLevel(string $yearLevel): string
    {
        $group = $this->classGroupFromText($yearLevel);

        return $group['year_level'] ?? $this->cleanImportedText($yearLevel);
    }

    private function optionalText(string $value): string
    {
        return $this->cleanImportedText($value);
    }

    private function normalizeRFIDUid(string $value): string
    {
        $digits = preg_replace('/\D+/', '', $value) ?: '';

        return preg_match('/^\d{10}$/', $digits) ? $digits : '';
    }

    private function normalizeSchoolId(string $value): string
    {
        return $this->optionalText($value);
    }

    private function domNodeText(\DOMNode $node, \DOMXPath $xpath): string
    {
        $text = '';

        foreach ($xpath->query('.//w:t', $node) as $textNode) {
            $text .= $textNode->textContent;
        }

        return trim($text);
    }

    private function xlsxColumnIndex(string $reference): int
    {
        preg_match('/^[A-Z]+/', $reference, $matches);
        $letters = $matches[0] ?? 'A';
        $index = 0;

        foreach (str_split($letters) as $letter) {
            $index = ($index * 26) + (ord($letter) - 64);
        }

        return $index - 1;
    }

    /**
     * @param  array<string, string>  $row
     * @return array<string, string>
     */
    private function normalizeRow(array $row): array
    {
        $row = collect($row)
            ->mapWithKeys(fn ($value, $key) => [$this->normalizeHeader((string) $key) => trim((string) $value)])
            ->all();

        $row['_has_disallowed_single_name_column'] = $this->hasDisallowedSingleNameColumn($row) ? '1' : '0';
        $row = $this->applyHeaderAliases($row);
        $row['_has_required_name_columns'] = $this->hasRequiredNameColumns($row) ? '1' : '0';
        $row['_has_school_id_column'] = array_key_exists('school_id', $row) ? '1' : '0';
        $row['_school_id_raw'] = $this->optionalText($row['school_id'] ?? '');
        $row['_rfid_uid_raw'] = $this->optionalText($row['rfid_uid'] ?? '');

        $row['type'] = $this->visitorTypeForRow($row);
        $row['school_id'] = $this->normalizeSchoolId($row['school_id'] ?? '');
        $row['rfid_uid'] = $this->normalizeRFIDUid($row['rfid_uid'] ?? '');
        $row['first_name'] = PersonName::requiredPart($row['first_name'] ?? '');
        $row['middle_name'] = PersonName::part($row['middle_name'] ?? null) ?? '';
        $row['last_name'] = PersonName::requiredPart($row['last_name'] ?? '');

        if (($row['year_level'] ?? '') !== '') {
            $row['year_level'] = $this->normalizeYearLevel($row['year_level']);
        }

        return $row;
    }

    private function normalizeHeader(string $header): string
    {
        return Str::of($header)
            ->lower()
            ->replace(['#', '/'], ' ')
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_')
            ->toString();
    }

    /**
     * @param  array<string, string>  $row
     * @return array<string, string>
     */
    private function applyHeaderAliases(array $row): array
    {
        $aliases = [
            'id_number' => 'school_id',
            'id_no' => 'school_id',
            'id_num' => 'school_id',
            'id' => 'school_id',
            'student_id' => 'school_id',
            'student_no' => 'school_id',
            'student_number' => 'school_id',
            'employee_id' => 'school_id',
            'employee_no' => 'school_id',
            'employee_number' => 'school_id',
            'school_identification' => 'school_id',
            'school_identification_number' => 'school_id',
            'school_number' => 'school_id',
            'school_no' => 'school_id',
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

        foreach ($aliases as $alias => $canonical) {
            if (($row[$canonical] ?? '') === '' && ($row[$alias] ?? '') !== '') {
                $row[$canonical] = $row[$alias];
            }
        }

        return $row;
    }

    /**
     * @param  array<string, string>  $row
     */
    private function visitorTypeForRow(array $row): string
    {
        $type = strtolower($row['type'] ?? $row['visitor_type'] ?? '');

        if (str_contains($type, 'employee') || str_contains($type, 'staff') || str_contains($type, 'faculty')) {
            return RegisteredVisitor::TYPE_EMPLOYEE;
        }

        if (str_contains($type, 'student')) {
            return RegisteredVisitor::TYPE_STUDENT;
        }

        if (($row['department'] ?? '') !== '') {
            return RegisteredVisitor::TYPE_EMPLOYEE;
        }

        return RegisteredVisitor::TYPE_STUDENT;
    }

    /**
     * @param  array<string, string>  $row
     */
    private function hasMinimumVisitorData(array $row): bool
    {
        if (! in_array($row['type'] ?? '', [RegisteredVisitor::TYPE_STUDENT, RegisteredVisitor::TYPE_EMPLOYEE], true)) {
            return false;
        }

        return ($row['_has_disallowed_single_name_column'] ?? '') !== '1'
            && ($row['_has_required_name_columns'] ?? '') === '1'
            && ($row['_has_school_id_column'] ?? '') === '1'
            && ($row['first_name'] ?? '') !== ''
            && ($row['last_name'] ?? '') !== ''
            && ($row['school_id'] ?? '') !== '';
    }

    /**
     * @param  array<string, string>  $row
     */
    private function minimumVisitorDataMessage(array $row): string
    {
        if (($row['_has_disallowed_single_name_column'] ?? '') === '1') {
            return 'Full-name columns are not accepted. Use separate First Name, Middle Name, and Last Name columns.';
        }

        if (($row['_has_required_name_columns'] ?? '') !== '1') {
            return 'Import rows must include separate First/Given Name and Last Name columns. Middle Name is optional and may be blank.';
        }

        if (($row['_has_school_id_column'] ?? '') !== '1') {
            return 'A School ID column is required. School ID is the import key used to prevent duplicate visitor records.';
        }

        if (($row['school_id'] ?? '') === '') {
            return 'School ID is required.';
        }

        return 'First Name, Last Name, and School ID are required. Middle Name is optional.';
    }

    /**
     * @param  array<string, string>  $row
     */
    private function hasRequiredNameColumns(array $row): bool
    {
        return array_key_exists('first_name', $row)
            && array_key_exists('last_name', $row);
    }

    /**
     * @param  array<string, string>  $row
     */
    private function hasDisallowedSingleNameColumn(array $row): bool
    {
        $allowedNameHeaders = [
            'first_name',
            'given_name',
            'middle_name',
            'last_name',
            'surname',
        ];

        foreach (array_keys($row) as $header) {
            if (in_array($header, $allowedNameHeaders, true)) {
                continue;
            }

            if (
                $header === 'name'
                || str_starts_with($header, 'name_of_')
                || str_contains($header, 'full_name')
                || str_contains($header, 'complete_name')
                || (str_contains($header, 'full') && str_contains($header, 'name'))
                || in_array($header, ['student_name', 'employee_name', 'visitor_name', 'member_name'], true)
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<string, string>  $row
     */
    private function findVisitor(array $row, ?SchoolYear $schoolYear): ?RegisteredVisitor
    {
        if (($row['school_id'] ?? '') !== '') {
            return RegisteredVisitor::query()
                ->where('school_id', $row['school_id'])
                ->first();
        }

        return null;
    }

    /**
     * @param  array<string, string>  $row
     */
    private function identifierConflictsWithAnotherVisitor(array $row, RegisteredVisitor $visitor): bool
    {
        if (($row['school_id'] ?? '') !== '' && RegisteredVisitor::query()
            ->where('school_id', $row['school_id'])
            ->whereKeyNot($visitor->id)
            ->exists()) {
            return true;
        }

        if (($row['rfid_uid'] ?? '') !== '' && RegisteredVisitor::query()
            ->where('rfid_uid', $row['rfid_uid'])
            ->whereKeyNot($visitor->id)
            ->exists()) {
            return true;
        }

        return false;
    }

    /**
     * @param  array<string, string>  $row
     */
    private function rowRejectionMessage(array $row, ?RegisteredVisitor $visitor = null): ?string
    {
        if (($row['_has_disallowed_single_name_column'] ?? '') === '1') {
            return 'Full-name columns are not accepted. Use separate First Name, Middle Name, and Last Name columns.';
        }

        if (($row['_rfid_uid_raw'] ?? '') !== '' && ($row['rfid_uid'] ?? '') === '') {
            return 'RFID must be blank or contain exactly 10 digits.';
        }

        if ($message = $this->identifierConflictMessage($row, $visitor)) {
            return $message;
        }

        if ($visitor && ! $this->importRowMatchesExistingIdentity($row, $visitor)) {
            return "School ID {$row['school_id']} already belongs to {$visitor->full_name}. Edit that visitor in the app if this identity needs to change.";
        }

        if ($visitor) {
            return $this->canFillMissingRfid($visitor, $row)
                ? null
                : "School ID {$row['school_id']} is already registered. Imports only create new visitors; edit existing visitor details in the app.";
        }

        if ($existingVisitor = $this->findVisitorByCompatibleIdentity($row)) {
            return "{$existingVisitor->full_name} is already registered with School ID {$existingVisitor->school_id}. Imports cannot create duplicate visitors with a different School ID.";
        }

        return null;
    }

    /**
     * @param  array<string, string>  $row
     */
    private function importRowMatchesExistingIdentity(array $row, RegisteredVisitor $visitor): bool
    {
        return $visitor->type === ($row['type'] ?? null)
            && strcasecmp($this->optionalText($visitor->first_name ?? ''), $row['first_name'] ?? '') === 0
            && $this->middleNamesAreCompatible($this->optionalText($visitor->middle_name ?? ''), $row['middle_name'] ?? '')
            && strcasecmp($this->optionalText($visitor->last_name ?? ''), $row['last_name'] ?? '') === 0;
    }

    /**
     * @param  array<string, string>  $row
     */
    private function findVisitorByCompatibleIdentity(array $row): ?RegisteredVisitor
    {
        return RegisteredVisitor::query()
            ->where('type', $row['type'])
            ->whereRaw('LOWER(first_name) = ?', [mb_strtolower($row['first_name'] ?? '')])
            ->whereRaw('LOWER(last_name) = ?', [mb_strtolower($row['last_name'] ?? '')])
            ->get()
            ->first(fn (RegisteredVisitor $visitor): bool => $this->middleNamesAreCompatible(
                $this->optionalText($visitor->middle_name ?? ''),
                $row['middle_name'] ?? '',
            ));
    }

    private function middleNamesAreCompatible(string $existing, string $incoming): bool
    {
        $existing = $this->optionalText($existing);
        $incoming = $this->optionalText($incoming);

        return $existing === ''
            || $incoming === ''
            || strcasecmp($existing, $incoming) === 0;
    }

    /**
     * @param  array<string, string>  $row
     */
    private function canFillMissingRfid(RegisteredVisitor $visitor, array $row): bool
    {
        return ($row['rfid_uid'] ?? '') !== ''
            && blank($visitor->rfid_uid)
            && $this->importRowMatchesExistingIdentity($row, $visitor);
    }

    /**
     * @param  array<string, string>  $row
     */
    private function fillMissingRfid(RegisteredVisitor $visitor, array $row): void
    {
        if (! $this->canFillMissingRfid($visitor, $row)) {
            return;
        }

        $visitor->forceFill([
            'rfid_uid' => $row['rfid_uid'],
        ])->save();
    }

    /**
     * @param  array<string, string>  $row
     */
    private function identifierConflictMessage(array $row, ?RegisteredVisitor $currentVisitor = null): ?string
    {
        if (($row['rfid_uid'] ?? '') !== '') {
            $visitor = RegisteredVisitor::query()
                ->where('rfid_uid', $row['rfid_uid'])
                ->first();

            if ($visitor && $visitor->isNot($currentVisitor)) {
                return "RFID {$row['rfid_uid']} already belongs to {$visitor->full_name}.";
            }
        }

        return null;
    }

    /**
     * @param  array<string, string>  $row
     */
    private function createVisitor(array $row): RegisteredVisitor
    {
        return RegisteredVisitor::create([
            'rfid_uid' => $this->rfidUid($row['rfid_uid'] ?? ''),
            'school_id' => $this->schoolId($row['school_id'] ?? ''),
            'type' => $row['type'],
            'first_name' => PersonName::requiredPart($row['first_name']),
            'middle_name' => $this->filledOrNull($row['middle_name'] ?? ''),
            'last_name' => PersonName::requiredPart($row['last_name']),
            'photo' => null,
        ]);
    }

    /**
     * @param  array<string, string>  $row
     */
    private function syncVisitorDetails(RegisteredVisitor $visitor, array $row, ?SchoolYear $schoolYear): void
    {
        if ($visitor->type === RegisteredVisitor::TYPE_EMPLOYEE) {
            if (! $schoolYear) {
                return;
            }

            $existingEmployeeProfile = $visitor->employeeProfiles()
                ->forSchoolYear($schoolYear->id)
                ->first();
            $department = $this->mergedOptionalText($existingEmployeeProfile?->department, $row['department'] ?? '') ?? 'Unassigned';

            $visitor->employeeProfiles()->updateOrCreate(
                ['school_year_id' => $schoolYear->id],
                $this->visitorSnapshot($visitor) + ['department' => $department],
            );

            return;
        }

        if (! $schoolYear) {
            return;
        }

        $existingStudentRegistration = $visitor->studentRegistrations()
            ->forSchoolYear($schoolYear->id)
            ->first();
        $yearLevel = $this->mergedOptionalText($existingStudentRegistration?->year_level, $row['year_level'] ?? '');

        if (! $yearLevel) {
            return;
        }

        $sectionName = $this->mergedOptionalText($existingStudentRegistration?->section, $row['section'] ?? '');
        $section = $sectionName
            ? SchoolYearSection::query()->firstOrCreate([
                'school_year_id' => $schoolYear->id,
                'year_level' => $yearLevel,
                'name' => $sectionName,
            ])
            : null;

        $visitor->studentRegistrations()->updateOrCreate(
            ['school_year_id' => $schoolYear->id],
            $this->visitorSnapshot($visitor) + [
                'school_year_section_id' => $section?->id,
                'year_level' => $yearLevel,
                'section' => $sectionName,
            ],
        );
    }

    /**
     * @param  array<string, string>  $row
     */
    private function syncVisit(RegisteredVisitor $visitor, array $row, ?SchoolYear $schoolYear): bool
    {
        $visitedAt = $this->dateFromRow($row['visited_at'] ?? '');

        if (! $schoolYear || ! $visitedAt) {
            return false;
        }

        return LibraryVisit::query()->firstOrCreate([
            'registered_visitor_id' => $visitor->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => $visitedAt,
        ])->wasRecentlyCreated;
    }

    /**
     * @param  array<string, string>  $row
     */
    private function previewName(array $row): string
    {
        $middleInitial = ($row['middle_name'] ?? '') !== ''
            ? mb_strtoupper(mb_substr($row['middle_name'], 0, 1)).'.'
            : null;

        return trim(collect([$row['first_name'] ?? '', $middleInitial, $row['last_name'] ?? ''])->filter()->implode(' '));
    }

    private function dateFromRow(string $value): ?Carbon
    {
        if ($value === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function rfidUid(string $rfidUid, ?int $ignoreVisitorId = null): ?string
    {
        if ($rfidUid === '') {
            return null;
        }

        if (! preg_match('/^\d{10}$/', $rfidUid)) {
            return null;
        }

        $exists = RegisteredVisitor::query()
            ->where('rfid_uid', $rfidUid)
            ->when($ignoreVisitorId, fn ($query) => $query->whereKeyNot($ignoreVisitorId))
            ->exists();

        return $exists ? null : $rfidUid;
    }

    private function schoolId(string $schoolId, ?int $ignoreVisitorId = null): ?string
    {
        $schoolId = $this->optionalText($schoolId);

        if ($schoolId === '') {
            return null;
        }

        $exists = RegisteredVisitor::query()
            ->where('school_id', $schoolId)
            ->when($ignoreVisitorId, fn ($query) => $query->whereKeyNot($ignoreVisitorId))
            ->exists();

        return $exists ? null : $schoolId;
    }

    private function mergedRequiredText(?string $current, ?string $incoming): string
    {
        $current = $this->optionalText($current ?? '');
        $incoming = $this->optionalText($incoming ?? '');

        if ($incoming === '') {
            return $current;
        }

        if (strcasecmp($incoming, 'Imported') === 0 && $current !== '' && strcasecmp($current, 'Imported') !== 0) {
            return $current;
        }

        return $incoming;
    }

    private function mergedOptionalText(?string $current, ?string $incoming): ?string
    {
        $incoming = $this->optionalText($incoming ?? '');
        $current = PersonName::part($this->filledOrNull($current ?? ''));

        if ($incoming !== '') {
            if ($this->isMiddleInitial($incoming) && $current && str_starts_with(mb_strtolower($current), mb_strtolower(rtrim($incoming, '.')))) {
                return $current;
            }

            return PersonName::part($incoming);
        }

        return $current;
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

    private function visitorSnapshot(RegisteredVisitor $visitor): array
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

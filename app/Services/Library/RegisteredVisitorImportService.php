<?php

namespace App\Services\Library;

use App\Models\RegisteredVisitor;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RegisteredVisitorImportService
{
    /**
     * @return array{created: int, updated: int, restored: int, visits: int, skipped: int}
     */
    public function import(UploadedFile $file): array
    {
        $rows = $this->readRows($file);

        return DB::transaction(function () use ($rows): array {
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

                $schoolYear = $this->schoolYearForRow($row);
                $visitor = $this->findVisitor($row);
                $wasNew = ! $visitor;

                $visitor = $visitor
                    ? $this->updateVisitor($visitor, $row)
                    : $this->createVisitor($row);

                $this->syncVisitorDetails($visitor, $row, $schoolYear);

                if ($this->syncVisit($visitor, $row, $schoolYear)) {
                    $summary['visits']++;
                }

                $summary[$wasNew ? 'created' : 'updated']++;
            }

            return $summary;
        });
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

        if ($extension === 'xlsx') {
            return $this->readXlsxRows((string) $path);
        }

        return $this->readCsvRows($path);
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function readCsvRows(string $path): array
    {
        $handle = fopen($path, 'r');

        if (! $handle) {
            return [];
        }

        $headers = null;
        $rows = [];

        while (($data = fgetcsv($handle)) !== false) {
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

        $sharedStrings = $this->xlsxSharedStrings($zip);
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if (! is_string($sheetXml)) {
            return [];
        }

        $xml = simplexml_load_string($sheetXml);

        if (! $xml) {
            return [];
        }

        $headers = [];
        $rows = [];

        foreach ($xml->sheetData->row as $rowIndex => $row) {
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

            if ((int) $rowIndex === 0) {
                $headers = array_map(fn ($header) => $this->normalizeHeader($header), $values);

                continue;
            }

            if ($headers === [] || count(array_filter($values, fn ($value) => trim($value) !== '')) === 0) {
                continue;
            }

            $rows[] = array_combine($headers, array_pad($values, count($headers), '')) ?: [];
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

        $row = $this->applyHeaderAliases($row);

        if (($row['first_name'] ?? '') === '' && ($row['last_name'] ?? '') === '' && ($row['name'] ?? '') !== '') {
            [$row['first_name'], $row['last_name']] = $this->splitName($row['name']);
        }

        $row['type'] = $this->visitorTypeForRow($row);

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
            'student_id' => 'school_id',
            'student_no' => 'school_id',
            'employee_id' => 'school_id',
            'employee_no' => 'school_id',
            'lrn' => 'school_id',
            'rfid' => 'rfid_uid',
            'rfid_id' => 'rfid_uid',
            'rfid_unique_id' => 'rfid_uid',
            'uid' => 'rfid_uid',
            'grade' => 'year_level',
            'grade_level' => 'year_level',
            'year' => 'year_level',
            'level' => 'year_level',
            'strand_section' => 'section',
            'name_of_employee' => 'name',
            'name_of_student' => 'name',
            'full_name' => 'name',
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
        return ($row['school_id'] ?? '') !== ''
            && ($row['first_name'] ?? '') !== ''
            && ($row['last_name'] ?? '') !== ''
            && in_array($row['type'] ?? '', [RegisteredVisitor::TYPE_STUDENT, RegisteredVisitor::TYPE_EMPLOYEE], true);
    }

    /**
     * @param  array<string, string>  $row
     */
    private function findVisitor(array $row): ?RegisteredVisitor
    {
        return RegisteredVisitor::query()
            ->where('school_id', $row['school_id'])
            ->when($row['rfid_uid'] ?? null, fn ($query, $rfidUid) => $query->orWhere('rfid_uid', $rfidUid))
            ->first();
    }

    /**
     * @param  array<string, string>  $row
     */
    private function createVisitor(array $row): RegisteredVisitor
    {
        return RegisteredVisitor::create([
            'rfid_uid' => $this->rfidUid($row['rfid_uid'] ?? ''),
            'school_id' => $row['school_id'],
            'type' => $row['type'],
            'first_name' => $row['first_name'],
            'middle_name' => $row['middle_name'] ?? null,
            'last_name' => $row['last_name'],
            'photo' => null,
        ]);
    }

    /**
     * @param  array<string, string>  $row
     */
    private function updateVisitor(RegisteredVisitor $visitor, array $row): RegisteredVisitor
    {
        $visitor->update([
            'type' => $row['type'],
            'first_name' => $row['first_name'],
            'middle_name' => $row['middle_name'] ?? null,
            'last_name' => $row['last_name'],
        ]);

        return $visitor->refresh();
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

            $visitor->employeeProfiles()->updateOrCreate(
                ['school_year_id' => $schoolYear->id],
                $this->visitorSnapshot($visitor) + ['department' => $row['department'] ?? 'Unassigned'],
            );

            return;
        }

        if (! $schoolYear || ($row['year_level'] ?? '') === '') {
            return;
        }

        $sectionName = ($row['section'] ?? '') !== '' ? $row['section'] : null;
        $section = $sectionName
            ? SchoolYearSection::query()->firstOrCreate([
                'school_year_id' => $schoolYear->id,
                'year_level' => $row['year_level'],
                'name' => $sectionName,
            ])
            : null;

        $visitor->studentRegistrations()->updateOrCreate(
            ['school_year_id' => $schoolYear->id],
            $this->visitorSnapshot($visitor) + [
                'school_year_section_id' => $section?->id,
                'year_level' => $row['year_level'],
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
    private function schoolYearForRow(array $row): ?SchoolYear
    {
        $name = $row['visit_school_year'] ?? $row['school_year'] ?? '';

        if ($name !== '') {
            preg_match('/^(?<start>\d{4})-(?<end>\d{4})$/', $name, $matches);

            return SchoolYear::query()->firstOrCreate(
                ['name' => $name],
                [
                    'starts_at' => ($matches['start'] ?? now()->year).'-05-01',
                    'ends_at' => ($matches['end'] ?? now()->addYear()->year).'-03-31',
                    'student_required_visits' => 4,
                    'employee_required_visits' => 4,
                    'is_active' => false,
                ],
            );
        }

        return SchoolYear::active()->first();
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];

        if (count($parts) <= 1) {
            return [$name, 'Imported'];
        }

        $lastName = array_pop($parts);

        return [implode(' ', $parts), (string) $lastName];
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

    private function rfidUid(string $rfidUid): string
    {
        if (preg_match('/^\d{10}$/', $rfidUid) && ! RegisteredVisitor::query()->where('rfid_uid', $rfidUid)->exists()) {
            return $rfidUid;
        }

        do {
            $rfidUid = (string) random_int(1000000000, 9999999999);
        } while (RegisteredVisitor::query()->where('rfid_uid', $rfidUid)->exists());

        return $rfidUid;
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

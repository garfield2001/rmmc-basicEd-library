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

                if ($visitor->trashed()) {
                    $visitor->restore();
                    $summary['restored']++;
                }

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
     * @param  array<string, string>  $row
     * @return array<string, string>
     */
    private function normalizeRow(array $row): array
    {
        $row = collect($row)
            ->mapWithKeys(fn ($value, $key) => [$this->normalizeHeader((string) $key) => trim((string) $value)])
            ->all();

        if (($row['first_name'] ?? '') === '' && ($row['last_name'] ?? '') === '' && ($row['name'] ?? '') !== '') {
            [$row['first_name'], $row['last_name']] = $this->splitName($row['name']);
        }

        $row['type'] = strtolower($row['type'] ?? RegisteredVisitor::TYPE_STUDENT);

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
        return RegisteredVisitor::withTrashed()
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
            'is_active' => $this->isActive($row),
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
            'is_active' => $this->isActive($row),
        ]);

        return $visitor->refresh();
    }

    /**
     * @param  array<string, string>  $row
     */
    private function syncVisitorDetails(RegisteredVisitor $visitor, array $row, ?SchoolYear $schoolYear): void
    {
        if ($visitor->type === RegisteredVisitor::TYPE_EMPLOYEE) {
            $visitor->employee()->updateOrCreate([], [
                'department' => $row['department'] ?? 'Unassigned',
            ]);

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
            [
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
                    'minimum_visits' => 3,
                    'target_visits' => 4,
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

    /**
     * @param  array<string, string>  $row
     */
    private function isActive(array $row): bool
    {
        $status = strtolower($row['status_before_archive'] ?? $row['status'] ?? 'active');

        return ! in_array($status, ['inactive', '0', 'false', 'no'], true);
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
        if (preg_match('/^\d{10}$/', $rfidUid) && ! RegisteredVisitor::withTrashed()->where('rfid_uid', $rfidUid)->exists()) {
            return $rfidUid;
        }

        do {
            $rfidUid = (string) random_int(1000000000, 9999999999);
        } while (RegisteredVisitor::withTrashed()->where('rfid_uid', $rfidUid)->exists());

        return $rfidUid;
    }
}

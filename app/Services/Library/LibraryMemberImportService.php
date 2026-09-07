<?php

namespace App\Services\Library;

use App\Models\SchoolYear;
use App\Services\Library\Imports\LibraryMemberImportFileReader;
use App\Services\Library\Imports\LibraryMemberImportIdentityGuard;
use App\Services\Library\Imports\LibraryMemberImportPreviewBuilder;
use App\Services\Library\Imports\LibraryMemberImportRowNormalizer;
use App\Services\Library\Imports\LibraryMemberImportWriter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class LibraryMemberImportService
{
    public function __construct(
        private readonly LibraryMemberImportFileReader $files,
        private readonly LibraryMemberImportIdentityGuard $identity,
        private readonly LibraryMemberImportPreviewBuilder $preview,
        private readonly LibraryMemberImportRowNormalizer $rows,
        private readonly LibraryMemberImportWriter $writer,
    ) {}

    /**
     * @return array{created: int, updated: int, restored: int, visits: int, skipped: int, skipped_rows: array<int, array<string, mixed>>}
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
                'skipped_rows' => [],
            ];

            foreach ($rows as $row) {
                $row = $this->rows->normalize($row);

                if (! $this->rows->hasMinimumVisitorData($row)) {
                    $reason = $this->rows->minimumVisitorDataMessage($row);
                    $summary['skipped']++;
                    $summary['skipped_rows'][] = $this->preview->formatSkippedRow($row, $reason);

                    continue;
                }

                $visitor = $this->identity->findVisitor($row);

                if ($reason = $this->identity->rejectionMessage($row, $visitor)) {
                    $summary['skipped']++;
                    $summary['skipped_rows'][] = $this->preview->formatSkippedRow($row, $reason);

                    continue;
                }

                if ($visitor) {
                    $this->writer->fillMissingRfid($visitor, $row);
                    $summary['updated']++;

                    continue;
                }

                $visitor = $this->writer->createVisitor($row);
                $this->writer->syncVisitorDetails($visitor, $row, $schoolYear);

                if ($this->writer->syncVisit($visitor, $row, $schoolYear)) {
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

        try {
            return $this->preview->build($file);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            throw ValidationException::withMessages([
                'visitors_file' => 'The import file could not be read. Please check that it uses separate First Name, Last Name, and School ID columns, then try again.',
            ]);
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function readRows(UploadedFile $file): array
    {
        try {
            return $this->files->read($file);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            throw ValidationException::withMessages([
                'visitors_file' => 'The import file could not be read. Please check that it uses separate First Name, Last Name, and School ID columns, then try again.',
            ]);
        }
    }
}

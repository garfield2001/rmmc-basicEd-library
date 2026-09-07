<?php

namespace App\Services\Library\Imports;

use App\Models\LibraryMember;
use Illuminate\Http\UploadedFile;

class LibraryMemberImportPreviewBuilder
{
    public function __construct(
        private readonly LibraryMemberImportFileReader $files,
        private readonly LibraryMemberImportIdentityGuard $identity,
        private readonly LibraryMemberImportRowNormalizer $rows,
    ) {}

    /**
     * @return array{file_name: string, total_rows: int, importable_count: int, skipped_count: int, create_count: int, update_count: int, members: array<int, array<string, mixed>>, skipped: array<int, array<string, mixed>>}
     */
    public function build(UploadedFile $file): array
    {
        $members = [];
        $skipped = [];

        foreach ($this->files->read($file) as $row) {
            $row = $this->rows->normalize($row);

            if (! $this->rows->hasMinimumVisitorData($row)) {
                $skipped[] = $this->skippedRow($row, $this->rows->minimumVisitorDataMessage($row));

                continue;
            }

            $visitor = $this->identity->findVisitor($row);

            if ($reason = $this->identity->rejectionMessage($row, $visitor)) {
                $skipped[] = $this->skippedRow($row, $reason);

                continue;
            }

            $members[] = $this->memberRow($row, $visitor);
        }

        return [
            'file_name' => $file->getClientOriginalName(),
            'total_rows' => count($members) + count($skipped),
            'importable_count' => count($members),
            'skipped_count' => count($skipped),
            'create_count' => collect($members)->where('status', 'create')->count(),
            'update_count' => collect($members)->where('status', 'rfid')->count(),
            'members' => $members,
            'skipped' => $skipped,
        ];
    }

    /**
     * @param  array<string, string>  $row
     */
    private function memberRow(array $row, ?LibraryMember $visitor): array
    {
        return [
            'status' => $visitor ? 'rfid' : 'create',
            'type' => $row['type'],
            'name' => $this->previewName($row),
            'matched_name' => $visitor?->full_name,
            'school_id' => $row['school_id'] ?: null,
            'rfid_uid' => $row['rfid_uid'] ?: null,
            'year_level' => $row['type'] === LibraryMember::TYPE_STUDENT ? ($row['year_level'] ?? null) : null,
            'section' => $row['type'] === LibraryMember::TYPE_STUDENT ? ($row['section'] ?? null) : null,
            'department' => $row['type'] === LibraryMember::TYPE_EMPLOYEE ? ($row['department'] ?? null) : null,
        ];
    }

    /**
     * @param  array<string, string>  $row
     * @return array{name: string, type: string, school_id: ?string, rfid_uid: ?string, year_level: ?string, section: ?string, department: ?string, reason: string}
     */
    public function formatSkippedRow(array $row, string $reason): array
    {
        return [
            'name' => $this->previewName($row) ?: 'Incomplete row',
            'type' => $row['type'] ?? LibraryMember::TYPE_STUDENT,
            'school_id' => ($row['_school_id_raw'] ?? '') !== '' ? $row['_school_id_raw'] : ($row['school_id'] ?? null),
            'rfid_uid' => ($row['_rfid_uid_raw'] ?? '') !== '' ? $row['_rfid_uid_raw'] : ($row['rfid_uid'] ?? null),
            'year_level' => ($row['year_level'] ?? '') !== '' ? $row['year_level'] : null,
            'section' => ($row['section'] ?? '') !== '' ? $row['section'] : null,
            'department' => ($row['department'] ?? '') !== '' ? $row['department'] : null,
            'reason' => $reason,
        ];
    }

    /**
     * @param  array<string, string>  $row
     */
    private function skippedRow(array $row, string $reason): array
    {
        return $this->formatSkippedRow($row, $reason);
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
}

<?php

namespace App\Services\Library\Imports;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Support\Names\PersonName;
use Illuminate\Support\Carbon;

class LibraryMemberImportWriter
{
    public function __construct(
        private readonly LibraryMemberImportIdentityGuard $identity,
        private readonly LibraryMemberImportDetailWriter $details,
    ) {}

    /**
     * @param  array<string, string>  $row
     */
    public function fillMissingRfid(LibraryMember $visitor, array $row): void
    {
        if (! $this->identity->canFillMissingRfid($visitor, $row)) {
            return;
        }

        $visitor->forceFill(['rfid_uid' => $row['rfid_uid']])->save();
    }

    /**
     * @param  array<string, string>  $row
     */
    public function createVisitor(array $row): LibraryMember
    {
        return LibraryMember::create([
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
    public function syncVisitorDetails(LibraryMember $visitor, array $row, ?SchoolYear $schoolYear): void
    {
        $this->details->sync($visitor, $row, $schoolYear);
    }

    /**
     * @param  array<string, string>  $row
     */
    public function syncVisit(LibraryMember $visitor, array $row, ?SchoolYear $schoolYear): bool
    {
        $visitedAt = $this->dateFromRow($row['visited_at'] ?? '');

        if (! $schoolYear || ! $visitedAt) {
            return false;
        }

        return LibraryVisit::query()->firstOrCreate([
            'library_member_id' => $visitor->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => $visitedAt,
        ])->wasRecentlyCreated;
    }

    private function dateFromRow(string $value): ?Carbon
    {
        try {
            return $value !== '' ? Carbon::parse($value) : null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function rfidUid(string $rfidUid): ?string
    {
        if ($rfidUid === '' || ! preg_match('/^\d{10}$/', $rfidUid)) {
            return null;
        }

        return LibraryMember::query()->where('rfid_uid', $rfidUid)->exists() ? null : $rfidUid;
    }

    private function schoolId(string $schoolId): ?string
    {
        $schoolId = $this->optionalText($schoolId);

        if ($schoolId === '') {
            return null;
        }

        return LibraryMember::query()->where('school_id', $schoolId)->exists() ? null : $schoolId;
    }

    private function optionalText(string $value): string
    {
        return trim(preg_replace('/[\s\x{00A0}]+/u', ' ', $value) ?: '');
    }

    private function filledOrNull(?string $value): ?string
    {
        $value = $this->optionalText($value ?? '');

        return $value === '' ? null : $value;
    }

}

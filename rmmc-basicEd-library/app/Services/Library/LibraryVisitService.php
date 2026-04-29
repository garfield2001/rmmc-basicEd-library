<?php

namespace App\Services\Library;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use Illuminate\Validation\ValidationException;

class LibraryVisitService
{
    public function recordFromRfid(string $rfidUid): LibraryVisit
    {
        $member = LibraryMember::active()
            ->where('rfid_uid', $rfidUid)
            ->first();

        if (! $member) {
            throw ValidationException::withMessages([
                'rfid_uid' => 'No active student or employee is registered with this RFID.',
            ]);
        }

        $schoolYear = SchoolYear::active()->first();

        if (! $schoolYear) {
            throw ValidationException::withMessages([
                'rfid_uid' => 'No active school year is configured for visit tracking.',
            ]);
        }

        return LibraryVisit::create([
            'library_member_id' => $member->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => now(),
        ])->load(['member', 'schoolYear']);
    }
}

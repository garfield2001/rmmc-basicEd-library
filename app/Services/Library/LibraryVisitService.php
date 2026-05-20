<?php

namespace App\Services\Library;

use App\Events\LibraryVisitRecorded;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class LibraryVisitService
{
    public function __construct(
        private readonly LibraryVisitLookupService $lookup,
        private readonly LibraryVisitRuleService $rules,
    ) {}

    public function recordFromRFID(string $RFIDUid): LibraryVisit
    {
        $now = now();
        $this->rules->ensureScanWindowIsOpen($now);

        $schoolYear = SchoolYear::active()->first();

        if (! $schoolYear) {
            throw ValidationException::withMessages([
                'rfid_uid' => 'No active school year is configured for visit tracking.',
            ]);
        }

        $this->rules->ensureSchoolYearIsOpen($schoolYear, $now);

        $visitor = $this->lookup->resolveVisitor($RFIDUid, $schoolYear->id);
        $this->rules->ensureVisitorHasRFID($visitor);
        $this->rules->ensureVisitorCanRevisit($visitor, $schoolYear->id, $now);

        $visit = LibraryVisit::create([
            'library_member_id' => $visitor->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => $now,
        ])->load(['visitor', 'schoolYear']);

        $this->broadcastLiveVisit($visit);

        return $visit;
    }

    private function broadcastLiveVisit(LibraryVisit $visit): void
    {
        if (! $this->shouldBroadcastLiveVisits()) {
            return;
        }

        try {
            LibraryVisitRecorded::dispatch($visit);
        } catch (Throwable $exception) {
            Log::warning('Library visit was recorded, but live broadcasting failed.', [
                'visit_id' => $visit->id,
                'message' => $exception->getMessage(),
            ]);
        }
    }

    private function shouldBroadcastLiveVisits(): bool
    {
        if (config('broadcasting.default') !== 'reverb') {
            return false;
        }

        return filled(config('broadcasting.connections.reverb.app_id'))
            && filled(config('broadcasting.connections.reverb.key'))
            && filled(config('broadcasting.connections.reverb.secret'))
            && filled(config('broadcasting.connections.reverb.options.host'));
    }
}

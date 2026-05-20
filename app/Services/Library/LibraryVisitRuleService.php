<?php

namespace App\Services\Library;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Services\Settings\LibraryScanSettingsService;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class LibraryVisitRuleService
{
    public function __construct(private readonly LibraryScanSettingsService $scanSettings) {}

    public function ensureScanWindowIsOpen(Carbon $now): void
    {
        $window = $this->scanSettings->scanWindow();
        $timezone = config('app.timezone');
        $currentTime = $now->copy()->timezone($timezone);
        $startsAt = Carbon::createFromFormat('H:i', $window['starts_at'], $timezone)->setDateFrom($currentTime);
        $endsAt = Carbon::createFromFormat('H:i', $window['ends_at'], $timezone)->setDateFrom($currentTime);
        $isOpen = $startsAt->lt($endsAt)
            ? $currentTime->betweenIncluded($startsAt, $endsAt)
            : $currentTime->gte($startsAt) || $currentTime->lte($endsAt);

        if (! $isOpen) {
            throw ValidationException::withMessages([
                'rfid_uid' => "Library visits can only be scanned from {$startsAt->format('g:i A')} to {$endsAt->format('g:i A')}.",
            ]);
        }
    }

    public function ensureSchoolYearIsOpen(SchoolYear $schoolYear, Carbon $now): void
    {
        $timezone = config('app.timezone');
        $currentDate = $now->copy()->timezone($timezone)->startOfDay();
        $startsAt = $schoolYear->startDate()->timezone($timezone)->startOfDay();
        $endsAt = $schoolYear->endDate()->timezone($timezone)->endOfDay();

        if (! $currentDate->betweenIncluded($startsAt, $endsAt)) {
            throw ValidationException::withMessages([
                'rfid_uid' => "The active school year {$schoolYear->name} is open for visits from {$startsAt->format('M j, Y')} to {$endsAt->format('M j, Y')}. Reports only count visits inside that range.",
            ]);
        }
    }

    public function ensureVisitorHasRFID(LibraryMember $visitor): void
    {
        if (! $visitor->rfid_uid) {
            throw ValidationException::withMessages([
                'rfid_uid' => "{$visitor->full_name} is registered but has no RFID yet. Add their RFID before recording a library visit.",
            ]);
        }
    }

    public function ensureVisitorCanRevisit(LibraryMember $visitor, int $schoolYearId, Carbon $now): void
    {
        $intervalHours = $this->scanSettings->repeatScanIntervalHours();
        $lastVisit = $visitor->visits()
            ->where('school_year_id', $schoolYearId)
            ->latest('visited_at')
            ->first();

        if (! $lastVisit || $lastVisit->visited_at->lte($now->copy()->subHours($intervalHours))) {
            return;
        }

        $nextAllowedAt = $lastVisit->visited_at->copy()->addHours($intervalHours)->timezone(config('app.timezone'));
        $lastVisitAt = $lastVisit->visited_at->copy()->timezone(config('app.timezone'));
        $intervalLabel = "{$intervalHours} ".str('hour')->plural($intervalHours);

        throw ValidationException::withMessages([
            'rfid_uid' => "This ID was already scanned at {$lastVisitAt->format('g:i A')}. A new visit can be recorded after {$nextAllowedAt->format('g:i A')} because repeat scans are limited to once every {$intervalLabel}.",
        ]);
    }
}

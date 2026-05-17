<?php

namespace App\Services\Library;

use App\Events\LibraryVisitRecorded;
use App\Models\LibraryVisit;
use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Services\Settings\LibraryScanSettingsService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class LibraryVisitService
{
    public function __construct(private readonly LibraryScanSettingsService $scanSettings) {}

    public function recordFromRFID(string $RFIDUid): LibraryVisit
    {
        $now = now();

        $this->ensureScanWindowIsOpen($now);

        $schoolYear = SchoolYear::active()->first();

        if (! $schoolYear) {
            throw ValidationException::withMessages([
                'rfid_uid' => 'No active school year is configured for visit tracking.',
            ]);
        }

        $this->ensureSchoolYearIsOpen($schoolYear, $now);

        $visitor = $this->resolveVisitor($RFIDUid, $schoolYear->id);
        $this->ensureVisitorHasRFID($visitor);
        $this->ensureVisitorCanRevisit($visitor, $schoolYear->id, $now);

        $visit = LibraryVisit::create([
            'registered_visitor_id' => $visitor->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => $now,
        ])->load(['visitor', 'schoolYear']);

        if ($this->shouldBroadcastLiveVisits()) {
            try {
                LibraryVisitRecorded::dispatch($visit);
            } catch (Throwable $exception) {
                Log::warning('Library visit was recorded, but live broadcasting failed.', [
                    'visit_id' => $visit->id,
                    'message' => $exception->getMessage(),
                ]);
            }
        }

        return $visit;
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

    private function resolveVisitor(string $lookup, int $schoolYearId): RegisteredVisitor
    {
        $normalizedLookup = $this->normalizeLookup($lookup);

        $visitors = RegisteredVisitor::query()
            ->visitEligibleForSchoolYear($schoolYearId)
            ->get()
            ->filter(function (RegisteredVisitor $visitor) use ($normalizedLookup): bool {
                $values = [
                    $visitor->rfid_uid,
                    $visitor->school_id,
                    $visitor->full_name,
                    trim(collect([$visitor->first_name, $visitor->middle_name, $visitor->last_name])->filter()->implode(' ')),
                    trim(collect([$visitor->first_name, $visitor->last_name])->filter()->implode(' ')),
                ];

                return collect($values)
                    ->filter()
                    ->contains(fn (string $value): bool => $this->normalizeLookup($value) === $normalizedLookup);
            })
            ->values();

        if ($visitors->isEmpty()) {
            $visitors = RegisteredVisitor::query()
                ->visitEligibleForSchoolYear($schoolYearId)
                ->get()
                ->filter(function (RegisteredVisitor $visitor) use ($normalizedLookup): bool {
                    $values = [
                        $visitor->rfid_uid,
                        $visitor->school_id,
                        $visitor->full_name,
                        trim(collect([$visitor->first_name, $visitor->middle_name, $visitor->last_name])->filter()->implode(' ')),
                        trim(collect([$visitor->first_name, $visitor->last_name])->filter()->implode(' ')),
                    ];

                    return collect($values)
                        ->filter()
                        ->contains(fn (string $value): bool => str_contains($this->normalizeLookup($value), $normalizedLookup));
                })
                ->values();
        }

        if ($visitors->count() === 1) {
            return $visitors->first();
        }

        if ($visitors->count() > 1) {
            throw ValidationException::withMessages([
                'rfid_uid' => 'Multiple registered visitors match that search. Please use the RFID or school ID.',
            ]);
        }

        throw ValidationException::withMessages([
            'rfid_uid' => 'No registered visitor eligible for the active school year matches that RFID, school ID, or name.',
        ]);
    }

    private function ensureVisitorHasRFID(RegisteredVisitor $visitor): void
    {
        if ($visitor->rfid_uid) {
            return;
        }

        throw ValidationException::withMessages([
            'rfid_uid' => "{$visitor->full_name} is registered but has no RFID yet. Add their RFID before recording a library visit.",
        ]);
    }

    private function ensureScanWindowIsOpen(Carbon $now): void
    {
        $window = $this->scanSettings->scanWindow();
        $timezone = config('app.timezone');
        $currentTime = $now->copy()->timezone($timezone);
        $startsAt = Carbon::createFromFormat('H:i', $window['starts_at'], $timezone)->setDateFrom($currentTime);
        $endsAt = Carbon::createFromFormat('H:i', $window['ends_at'], $timezone)->setDateFrom($currentTime);
        $isOpen = $startsAt->lt($endsAt)
            ? $currentTime->betweenIncluded($startsAt, $endsAt)
            : $currentTime->gte($startsAt) || $currentTime->lte($endsAt);

        if ($isOpen) {
            return;
        }

        throw ValidationException::withMessages([
            'rfid_uid' => "Library visits can only be scanned from {$startsAt->format('g:i A')} to {$endsAt->format('g:i A')}.",
        ]);
    }

    private function ensureSchoolYearIsOpen(SchoolYear $schoolYear, Carbon $now): void
    {
        $timezone = config('app.timezone');
        $currentDate = $now->copy()->timezone($timezone)->startOfDay();
        $startsAt = $schoolYear->starts_at->copy()->timezone($timezone)->startOfDay();
        $endsAt = $schoolYear->ends_at->copy()->timezone($timezone)->endOfDay();

        if ($currentDate->betweenIncluded($startsAt, $endsAt)) {
            return;
        }

        throw ValidationException::withMessages([
            'rfid_uid' => "The active school year {$schoolYear->name} is open for visits from {$startsAt->format('M j, Y')} to {$endsAt->format('M j, Y')}. Reports only count visits inside that range.",
        ]);
    }

    private function ensureVisitorCanRevisit(RegisteredVisitor $visitor, int $schoolYearId, Carbon $now): void
    {
        $intervalHours = $this->scanSettings->repeatScanIntervalHours();
        $lastVisit = $visitor->visits()
            ->where('school_year_id', $schoolYearId)
            ->latest('visited_at')
            ->first();

        if (! $lastVisit || $lastVisit->visited_at->lte($now->copy()->subHours($intervalHours))) {
            return;
        }

        $nextAllowedAt = $lastVisit->visited_at
            ->copy()
            ->addHours($intervalHours)
            ->timezone(config('app.timezone'));
        $lastVisitAt = $lastVisit->visited_at
            ->copy()
            ->timezone(config('app.timezone'));
        $intervalLabel = "{$intervalHours} ".str('hour')->plural($intervalHours);

        throw ValidationException::withMessages([
            'rfid_uid' => "This ID was already scanned at {$lastVisitAt->format('g:i A')}. A new visit can be recorded after {$nextAllowedAt->format('g:i A')} because repeat scans are limited to once every {$intervalLabel}.",
        ]);
    }

    private function normalizeLookup(string $value): string
    {
        return str(strtolower(trim($value)))
            ->squish()
            ->toString();
    }
}

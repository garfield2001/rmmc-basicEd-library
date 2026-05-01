<?php

namespace App\Services\Library;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class LibraryVisitService
{
    public function recordFromRfid(string $rfidUid): LibraryVisit
    {
        $now = now();

        $this->ensureScanWindowIsOpen($now);

        $member = $this->resolveMember($rfidUid);
        $schoolYear = SchoolYear::active()->first();

        if (! $schoolYear) {
            throw ValidationException::withMessages([
                'rfid_uid' => 'No active school year is configured for visit tracking.',
            ]);
        }

        $this->ensureMemberCanRevisit($member, $now);

        return LibraryVisit::create([
            'library_member_id' => $member->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => $now,
        ])->load(['member', 'schoolYear']);
    }

    private function resolveMember(string $lookup): LibraryMember
    {
        $normalizedLookup = $this->normalizeLookup($lookup);

        $members = LibraryMember::active()
            ->get()
            ->filter(function (LibraryMember $member) use ($normalizedLookup): bool {
                $values = [
                    $member->rfid_uid,
                    $member->school_id,
                    $member->first_name,
                    $member->last_name,
                    $member->full_name,
                ];

                return collect($values)
                    ->filter()
                    ->contains(fn (string $value): bool => $this->normalizeLookup($value) === $normalizedLookup);
            })
            ->values();

        if ($members->isEmpty()) {
            $members = LibraryMember::active()
                ->get()
                ->filter(function (LibraryMember $member) use ($normalizedLookup): bool {
                    $values = [
                        $member->rfid_uid,
                        $member->school_id,
                        $member->first_name,
                        $member->last_name,
                        $member->full_name,
                    ];

                    return collect($values)
                        ->filter()
                        ->contains(fn (string $value): bool => str_contains($this->normalizeLookup($value), $normalizedLookup));
                })
                ->values();
        }

        if ($members->count() === 1) {
            return $members->first();
        }

        if ($members->count() > 1) {
            throw ValidationException::withMessages([
                'rfid_uid' => 'Multiple active members match that search. Please use the RFID or school ID.',
            ]);
        }

        throw ValidationException::withMessages([
            'rfid_uid' => 'No active member matches that RFID, name, or school ID.',
        ]);
    }

    private function ensureScanWindowIsOpen(Carbon $now): void
    {
        // TODO: Restore the official library operating-hour restriction once the final schedule is confirmed.

    }

    private function ensureMemberCanRevisit(LibraryMember $member, Carbon $now): void
    {
        $lastVisit = $member->visits()
            ->latest('visited_at')
            ->first();

        if (! $lastVisit || $lastVisit->visited_at->lte($now->copy()->subHour())) {
            return;
        }

        $nextAllowedAt = $lastVisit->visited_at
            ->copy()
            ->addHour()
            ->timezone(config('app.timezone'));
        $lastVisitAt = $lastVisit->visited_at
            ->copy()
            ->timezone(config('app.timezone'));

        throw ValidationException::withMessages([
            'rfid_uid' => "This ID was already scanned at {$lastVisitAt->format('g:i A')}. A new visit can be recorded after {$nextAllowedAt->format('g:i A')} because repeat scans are limited to once per hour.",
        ]);
    }

    private function normalizeLookup(string $value): string
    {
        return str(strtolower(trim($value)))
            ->squish()
            ->toString();
    }
}

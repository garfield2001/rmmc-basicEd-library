<?php

namespace App\Services\Library;

use App\Models\LibraryMember;
use Illuminate\Validation\ValidationException;

class LibraryVisitLookupService
{
    public function resolveVisitor(string $lookup, int $schoolYearId): LibraryMember
    {
        $normalizedLookup = $this->normalizeLookup($lookup);
        $visitors = $this->matchingVisitors($normalizedLookup, $schoolYearId, false);

        if ($visitors->isEmpty()) {
            $visitors = $this->matchingVisitors($normalizedLookup, $schoolYearId, true);
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

    private function matchingVisitors(string $normalizedLookup, int $schoolYearId, bool $partial): mixed
    {
        return LibraryMember::query()
            ->visitEligibleForSchoolYear($schoolYearId)
            ->get()
            ->filter(fn (LibraryMember $visitor): bool => $this->visitorMatches($visitor, $normalizedLookup, $partial))
            ->values();
    }

    private function visitorMatches(LibraryMember $visitor, string $normalizedLookup, bool $partial): bool
    {
        return collect($this->lookupValues($visitor))
            ->filter()
            ->contains(function (string $value) use ($normalizedLookup, $partial): bool {
                $normalizedValue = $this->normalizeLookup($value);

                return $partial
                    ? str_contains($normalizedValue, $normalizedLookup)
                    : $normalizedValue === $normalizedLookup;
            });
    }

    private function lookupValues(LibraryMember $visitor): array
    {
        return [
            $visitor->rfid_uid,
            $visitor->school_id,
            $visitor->full_name,
            trim(collect([$visitor->first_name, $visitor->middle_name, $visitor->last_name])->filter()->implode(' ')),
            trim(collect([$visitor->first_name, $visitor->last_name])->filter()->implode(' ')),
        ];
    }

    private function normalizeLookup(string $value): string
    {
        return str(strtolower(trim($value)))->squish()->toString();
    }
}

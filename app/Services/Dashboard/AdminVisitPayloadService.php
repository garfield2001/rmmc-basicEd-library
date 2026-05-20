<?php

namespace App\Services\Dashboard;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;

class AdminVisitPayloadService
{
    public function visitData(LibraryVisit $visit): array
    {
        return [
            'id' => $visit->id,
            'visitedAt' => $visit->visited_at?->toIso8601String(),
            'visitor' => [
                'schoolId' => $visit->visitor?->school_id,
                'name' => $visit->visitor?->full_name,
                'type' => $visit->visitor?->type,
                'yearLevel' => $visit->visitor?->student?->year_level,
                'section' => $visit->visitor?->student?->section,
                'department' => $visit->visitor?->employee?->department,
                'photoUrl' => $this->photoUrl($visit->visitor),
            ],
        ];
    }

    public function visitorHistoryData(LibraryMember $visitor): array
    {
        return [
            'id' => $visitor->id,
            'schoolId' => $visitor->school_id,
            'name' => $visitor->full_name,
            'firstName' => $visitor->first_name,
            'lastName' => $visitor->last_name,
            'type' => $visitor->type,
            'yearLevel' => $visitor->student?->year_level,
            'section' => $visitor->student?->section,
            'department' => $visitor->employee?->department,
            'photoUrl' => $this->photoUrl($visitor),
            'visits' => $visitor->visits
                ->map(fn (LibraryVisit $visit): array => [
                    'id' => $visit->id,
                    'visitedAt' => $visit->visited_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];
    }

    public function scanTargetData(LibraryMember $visitor): array
    {
        return [
            'id' => $visitor->id,
            'RFIDUid' => $visitor->rfid_uid,
            'schoolId' => $visitor->school_id,
            'name' => $visitor->full_name,
            'firstName' => $visitor->first_name,
            'lastName' => $visitor->last_name,
            'type' => $visitor->type,
            'detail' => $visitor->type === LibraryMember::TYPE_EMPLOYEE
                ? $visitor->employee?->department
                : collect([$visitor->student?->year_level, $visitor->student?->section])->filter()->join(' - '),
        ];
    }

    private function photoUrl(?LibraryMember $visitor): ?string
    {
        return $visitor?->photo ? asset('visitor-photos/'.$visitor->photo) : null;
    }
}

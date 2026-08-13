<?php

namespace App\Services\Reports;

use App\Models\LibraryMember;
use App\Models\StudentSchoolYearRecord;
use App\Support\Academics\AcademicLevels;
use Illuminate\Support\Carbon;

class VisitReportRowService
{
    public function visitorRow(LibraryMember $visitor, int $requiredVisits): array
    {
        $studentRegistration = $visitor->studentSchoolYearRecords->first();
        $employeeProfile = $visitor->employee;
        $snapshot = $visitor->type === LibraryMember::TYPE_STUDENT ? $studentRegistration : $employeeProfile;

        return [
            'id' => $visitor->id,
            'school_id' => $snapshot?->school_id ?? $visitor->school_id,
            'name' => $this->snapshotName($snapshot, $visitor),
            'first_name' => $snapshot?->first_name ?? $visitor->first_name,
            'last_name' => $snapshot?->last_name ?? $visitor->last_name,
            'type' => $visitor->type,
            'department' => $visitor->type === LibraryMember::TYPE_EMPLOYEE ? $employeeProfile?->department : null,
            'year_level' => $visitor->type === LibraryMember::TYPE_STUDENT ? $studentRegistration?->year_level : null,
            'section' => $visitor->type === LibraryMember::TYPE_STUDENT ? $studentRegistration?->section : null,
            'year_section_label' => $visitor->type === LibraryMember::TYPE_STUDENT ? $this->studentYearSectionLabel($studentRegistration) : null,
            'visit_count' => (int) $visitor->visits_count,
            'excess_visits' => max(0, (int) $visitor->visits_count - $requiredVisits),
            'required_met' => $requiredVisits > 0 && $visitor->visits_count >= $requiredVisits,
            'progress_percent' => $requiredVisits > 0 ? min(100, round(($visitor->visits_count / $requiredVisits) * 100)) : 0,
            'last_visit_at' => $visitor->last_visit_at ? Carbon::parse($visitor->last_visit_at)->format('Y-m-d H:i:s') : null,
            'visits' => $visitor->visits
                ->map(fn ($visit): array => [
                    'id' => $visit->id,
                    'visited_at' => $visit->visited_at?->toIso8601String(),
                ])
                ->values(),
        ];
    }

    public function compare(array $first, array $second, string $visitorType, ?string $yearLevel, string $direction = 'asc'): int
    {
        if ($visitorType === LibraryMember::TYPE_STUDENT) {
            $studentCompare = $this->compareStudents($first, $second, $yearLevel, $direction);

            if ($studentCompare !== 0) {
                return $studentCompare;
            }
        }

        if ($visitorType === LibraryMember::TYPE_EMPLOYEE) {
            $departmentCompare = strnatcasecmp((string) ($first['department'] ?? ''), (string) ($second['department'] ?? ''));

            if ($departmentCompare !== 0) {
                return $direction === 'desc' ? -$departmentCompare : $departmentCompare;
            }
        }

        return $this->compareNames($first, $second);
    }

    private function compareStudents(array $first, array $second, ?string $yearLevel, string $direction = 'asc'): int
    {
        if (! $yearLevel) {
            $firstRank = $this->yearLevelRank($first['year_level'] ?? null);
            $secondRank = $this->yearLevelRank($second['year_level'] ?? null);
            $yearCompare = $firstRank <=> $secondRank;

            if ($yearCompare !== 0) {
                return $direction === 'desc' ? -$yearCompare : $yearCompare;
            }
        }

        $sectionCompare = strnatcasecmp((string) ($first['year_section_label'] ?? ''), (string) ($second['year_section_label'] ?? ''));
        if ($sectionCompare !== 0) {
            return $direction === 'desc' ? -$sectionCompare : $sectionCompare;
        }

        return 0;
    }

    private function compareNames(array $first, array $second): int
    {
        $lastNameCompare = strnatcasecmp((string) ($first['last_name'] ?? ''), (string) ($second['last_name'] ?? ''));

        return $lastNameCompare !== 0
            ? $lastNameCompare
            : strnatcasecmp((string) ($first['first_name'] ?? ''), (string) ($second['first_name'] ?? ''));
    }

    private function snapshotName(mixed $snapshot, LibraryMember $visitor): string
    {
        if (! $snapshot?->first_name || ! $snapshot?->last_name) {
            return $visitor->full_name;
        }

        $middleInitial = $snapshot->middle_name ? strtoupper(substr(trim($snapshot->middle_name), 0, 1)).'.' : null;

        return trim(collect([$snapshot->first_name, $middleInitial, $snapshot->last_name])->filter()->implode(' '));
    }

    private function studentYearSectionLabel(?StudentSchoolYearRecord $registration): ?string
    {
        if (! $registration) {
            return null;
        }

        return trim(collect([
            $registration->year_level,
            $registration->section,
        ])->filter()->implode(' - ')) ?: null;
    }

    private function yearLevelRank(?string $yearLevel): int
    {
        return AcademicLevels::rank($yearLevel) ?? 999;
    }
}

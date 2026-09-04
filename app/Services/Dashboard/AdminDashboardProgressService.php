<?php

namespace App\Services\Dashboard;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use Illuminate\Support\Collection;

class AdminDashboardProgressService
{
    public function requiredProgress(?SchoolYear $schoolYear): array
    {
        if (! $schoolYear) {
            return [];
        }

        return [
            $this->progressForType($schoolYear, LibraryMember::TYPE_STUDENT, 'Students', $schoolYear->student_required_visits),
            $this->progressForType($schoolYear, LibraryMember::TYPE_EMPLOYEE, 'Employees', $schoolYear->employee_required_visits),
        ];
    }

    public function individualProgress(?SchoolYear $schoolYear): array
    {
        if (! $schoolYear) {
            return [];
        }

        return collect([
            ...$this->individualProgressForType($schoolYear, LibraryMember::TYPE_STUDENT, $schoolYear->student_required_visits),
            ...$this->individualProgressForType($schoolYear, LibraryMember::TYPE_EMPLOYEE, $schoolYear->employee_required_visits),
        ])
            ->sortBy([['percent', 'asc'], ['remaining', 'desc'], ['visits', 'asc'], ['name', 'asc']])
            ->values()
            ->all();
    }

    private function progressForType(SchoolYear $schoolYear, string $type, string $label, int $requiredVisits): array
    {
        $baseQuery = LibraryMember::query()
            ->where('type', $type)
            ->visitEligibleForSchoolYear($schoolYear->id);

        $visitorCount = (clone $baseQuery)->count();

        $visitCount = LibraryVisit::query()
            ->where('school_year_id', $schoolYear->id)
            ->whereHas('visitor', fn ($query) => $query->where('type', $type))
            ->count();

        $metRequired = $requiredVisits > 0
            ? (clone $baseQuery)
                ->has('visits', '>=', $requiredVisits, 'and', fn ($query) => $query->where('school_year_id', $schoolYear->id))
                ->count()
            : 0;

        $requiredTotal = $visitorCount * $requiredVisits;

        return [
            'label' => $label,
            'required' => $requiredVisits,
            'visitors' => $visitorCount,
            'visits' => $visitCount,
            'required_total' => $requiredTotal,
            'met_required' => $metRequired,
            'percent' => $requiredTotal > 0 ? min(100, round(($visitCount / $requiredTotal) * 100)) : 0,
        ];
    }

    private function individualProgressForType(SchoolYear $schoolYear, string $type, int $requiredVisits): array
    {
        /** @var Collection<int, LibraryMember> $visitors */
        $visitors = LibraryMember::query()
            ->select(['id', 'school_id', 'rfid_uid', 'first_name', 'middle_name', 'last_name', 'type'])
            ->where('type', $type)
            ->visitEligibleForSchoolYear($schoolYear->id)
            ->with([
                'student' => AdminVisitRelations::student($schoolYear->id),
                'employee' => AdminVisitRelations::employee($schoolYear->id),
            ])
            ->withCount([
                'visits as visits_count' => fn ($query) => $query->where('school_year_id', $schoolYear->id),
            ])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return $visitors
            ->map(function (LibraryMember $visitor) use ($type, $requiredVisits): array {
                $visits = (int) $visitor->visits_count;
                $group = $type === LibraryMember::TYPE_EMPLOYEE
                    ? ($visitor->employee?->department ?: 'No department')
                    : (trim(collect([$visitor->student?->year_level, $visitor->student?->section])->filter()->implode(' - ')) ?: 'No year level or section');

                return [
                    'id' => $visitor->id,
                    'name' => $visitor->full_name,
                    'schoolId' => $visitor->school_id,
                    'type' => $type,
                    'group' => $group,
                    'visits' => $visits,
                    'required' => $requiredVisits,
                    'remaining' => max(0, $requiredVisits - $visits),
                    'percent' => $requiredVisits > 0 ? min(100, round(($visits / $requiredVisits) * 100)) : 0,
                ];
            })
            ->all();
    }
}

<?php

namespace App\Services\Dashboard;

use App\Models\EmployeeSchoolYearRecord;
use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\StudentSchoolYearRecord;
use App\Support\Academics\AcademicLevels;
use Illuminate\Support\Collection;

class AdminDashboardActivityService
{
    public function studentActivityVisits(?int $schoolYearId): array
    {
        return $this->studentVisits($schoolYearId)
            ->map(function (LibraryVisit $visit): array {
                $registration = $visit->visitor?->studentSchoolYearRecords?->firstWhere('school_year_id', $visit->school_year_id);

                return [
                    'visitorId' => $visit->library_member_id,
                    'visitedAt' => $visit->visited_at?->toDateString(),
                    'yearLevel' => $registration?->year_level,
                    'section' => $registration?->section,
                ];
            })
            ->values()
            ->all();
    }

    public function employeeActivityVisits(?int $schoolYearId): array
    {
        return $this->employeeVisits($schoolYearId)
            ->map(function (LibraryVisit $visit): array {
                $profile = $visit->visitor?->employeeSchoolYearRecords?->firstWhere('school_year_id', $visit->school_year_id);

                return [
                    'visitorId' => $visit->library_member_id,
                    'visitedAt' => $visit->visited_at?->toDateString(),
                    'department' => $profile?->department,
                ];
            })
            ->values()
            ->all();
    }

    public function groups(?int $schoolYearId): array
    {
        return [
            'yearLevels' => StudentSchoolYearRecord::query()
                ->forRequiredSchoolYear($schoolYearId)
                ->distinct()
                ->pluck('year_level')
                ->filter()
                ->sortBy(fn (string $level): int => AcademicLevels::rank($level) ?? 999)
                ->values()
                ->all(),
            'sections' => StudentSchoolYearRecord::query()
                ->forRequiredSchoolYear($schoolYearId)
                ->get(['year_level', 'section'])
                ->map(fn (StudentSchoolYearRecord $record): string => trim(collect([$record->year_level, $record->section])->filter()->implode(' - ')))
                ->filter()
                ->unique()
                ->values()
                ->all(),
            'departments' => EmployeeSchoolYearRecord::query()
                ->forRequiredSchoolYear($schoolYearId)
                ->distinct()
                ->pluck('department')
                ->filter()
                ->sort()
                ->values()
                ->all(),
        ];
    }

    public function studentVisitsByYearLevel(?int $schoolYearId): array
    {
        return $this->studentVisits($schoolYearId)
            ->groupBy(fn (LibraryVisit $visit): string => $this->studentGroup($visit, 'year_level') ?? 'Unassigned')
            ->map(fn (Collection $group, string $label): array => ['label' => $label, 'value' => $group->count()])
            ->sortByDesc('value')
            ->values()
            ->all();
    }

    public function studentVisitsBySection(?int $schoolYearId): array
    {
        return $this->studentVisits($schoolYearId)
            ->groupBy(fn (LibraryVisit $visit): string => trim(collect([
                $this->studentGroup($visit, 'year_level'),
                $this->studentGroup($visit, 'section'),
            ])->filter()->implode(' - ')) ?: 'Unassigned')
            ->map(fn (Collection $group, string $label): array => ['label' => $label, 'value' => $group->count()])
            ->sortByDesc('value')
            ->values()
            ->all();
    }

    public function employeeVisitsByDepartment(?int $schoolYearId): array
    {
        return $this->employeeVisits($schoolYearId)
            ->groupBy(function (LibraryVisit $visit): string {
                $profile = $visit->visitor?->employeeSchoolYearRecords?->firstWhere('school_year_id', $visit->school_year_id);

                return $profile?->department ?? 'Unassigned';
            })
            ->map(fn (Collection $group, string $label): array => ['label' => $label, 'value' => $group->count()])
            ->sortByDesc('value')
            ->values()
            ->all();
    }

    private function studentGroup(LibraryVisit $visit, string $field): ?string
    {
        return $visit->visitor?->studentSchoolYearRecords?->firstWhere('school_year_id', $visit->school_year_id)?->{$field};
    }

    private function studentVisits(?int $schoolYearId): Collection
    {
        return LibraryVisit::query()
            ->with('visitor.studentSchoolYearRecords')
            ->forRequiredSchoolYear($schoolYearId)
            ->whereHas('visitor', fn ($query) => $query->where('type', LibraryMember::TYPE_STUDENT))
            ->get();
    }

    private function employeeVisits(?int $schoolYearId): Collection
    {
        return LibraryVisit::query()
            ->with('visitor.employeeSchoolYearRecords')
            ->forRequiredSchoolYear($schoolYearId)
            ->whereHas('visitor', fn ($query) => $query->where('type', LibraryMember::TYPE_EMPLOYEE))
            ->get();
    }
}

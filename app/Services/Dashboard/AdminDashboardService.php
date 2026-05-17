<?php

namespace App\Services\Dashboard;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class AdminDashboardService
{
    public function getData(): array
    {
        $schoolYear = SchoolYear::active()->first();
        $today = Carbon::today();
        $studentVisitors = LibraryMember::where('type', LibraryMember::TYPE_STUDENT)->visitEligibleForSchoolYear($schoolYear?->id)->count();
        $employeeVisitors = LibraryMember::where('type', LibraryMember::TYPE_EMPLOYEE)->visitEligibleForSchoolYear($schoolYear?->id)->count();

        return [
            'schoolYear' => $schoolYear ? [
                'id' => $schoolYear->id,
                'name' => $schoolYear->name,
                'starts_at' => $schoolYear->starts_at->toDateString(),
                'ends_at' => $schoolYear->ends_at->toDateString(),
                'student_required_visits' => $schoolYear->student_required_visits,
                'employee_required_visits' => $schoolYear->employee_required_visits,
            ] : null,
            'metrics' => [
                'registeredVisitors' => $studentVisitors + $employeeVisitors,
                'studentSchoolYearRecords' => $schoolYear ? $schoolYear->studentSchoolYearRecords()->count() : 0,
                'visitsToday' => LibraryVisit::query()
                    ->whereDate('visited_at', $today)
                    ->when($schoolYear, fn ($query) => $query->where('school_year_id', $schoolYear->id), fn ($query) => $query->whereRaw('1 = 0'))
                    ->count(),
                'employeeVisitors' => $employeeVisitors,
            ],
            'visitorBreakdown' => [
                'students' => $studentVisitors,
                'employees' => $employeeVisitors,
            ],
            'charts' => [
                'visitsByDay' => [
                    'last7' => $this->visitsByDay($schoolYear?->id, 7),
                    'last14' => $this->visitsByDay($schoolYear?->id, 14),
                    'lastMonth' => $this->visitsByDay($schoolYear?->id, 30),
                ],
                'dailyVisits' => $this->dailyVisits($schoolYear),
                'studentActivityVisits' => $this->studentActivityVisits($schoolYear?->id),
                'employeeActivityVisits' => $this->employeeActivityVisits($schoolYear?->id),
                'studentVisitsByYearLevel' => $this->studentVisitsByYearLevel($schoolYear?->id),
                'studentVisitsBySection' => $this->studentVisitsBySection($schoolYear?->id),
                'employeeVisitsByDepartment' => $this->employeeVisitsByDepartment($schoolYear?->id),
                'requiredProgress' => $this->requiredProgress($schoolYear),
            ],
        ];
    }

    private function visitsByDay(?int $schoolYearId, int $days): array
    {
        $start = now()->subDays($days - 1)->startOfDay();
        $visits = LibraryVisit::query()
            ->with('visitor:id,type')
            ->where('visited_at', '>=', $start)
            ->when($schoolYearId, fn ($query) => $query->where('school_year_id', $schoolYearId), fn ($query) => $query->whereRaw('1 = 0'))
            ->get()
            ->groupBy(fn (LibraryVisit $visit): string => $visit->visited_at->toDateString());

        return collect(range(0, $days - 1))
            ->map(function (int $daysAgo) use ($visits, $days): array {
                $date = now()->subDays(($days - 1) - $daysAgo);
                $dailyVisits = $visits->get($date->toDateString(), collect());
                $studentVisits = $dailyVisits->filter(fn (LibraryVisit $visit): bool => $visit->visitor?->type === LibraryMember::TYPE_STUDENT)->count();
                $employeeVisits = $dailyVisits->filter(fn (LibraryVisit $visit): bool => $visit->visitor?->type === LibraryMember::TYPE_EMPLOYEE)->count();

                return [
                    'date' => $date->toDateString(),
                    'label' => $date->format('M d'),
                    'students' => $studentVisits,
                    'employees' => $employeeVisits,
                    'total' => $studentVisits + $employeeVisits,
                ];
            })
            ->values()
            ->all();
    }

    private function dailyVisits(?SchoolYear $schoolYear): array
    {
        if (! $schoolYear) {
            return [];
        }

        $start = $schoolYear->starts_at->copy()->startOfDay();
        $schoolYearEnd = $schoolYear->ends_at->copy()->startOfDay();
        $today = now()->startOfDay();
        $end = $schoolYearEnd->lt($today) ? $schoolYearEnd : $today;

        if ($end->lt($start)) {
            return [];
        }
        $visits = LibraryVisit::query()
            ->with('visitor:id,type')
            ->where('school_year_id', $schoolYear->id)
            ->whereBetween('visited_at', [$start, $end->copy()->endOfDay()])
            ->get()
            ->groupBy(fn (LibraryVisit $visit): string => $visit->visited_at->toDateString());

        return collect($start->daysUntil($end->copy()->addDay()))
            ->map(function (Carbon $date) use ($visits): array {
                $dailyVisits = $visits->get($date->toDateString(), collect());
                $studentVisits = $dailyVisits->filter(fn (LibraryVisit $visit): bool => $visit->visitor?->type === LibraryMember::TYPE_STUDENT)->count();
                $employeeVisits = $dailyVisits->filter(fn (LibraryVisit $visit): bool => $visit->visitor?->type === LibraryMember::TYPE_EMPLOYEE)->count();

                return [
                    'date' => $date->toDateString(),
                    'label' => $date->format('M d'),
                    'students' => $studentVisits,
                    'employees' => $employeeVisits,
                    'total' => $studentVisits + $employeeVisits,
                ];
            })
            ->values()
            ->all();
    }

    private function studentActivityVisits(?int $schoolYearId): array
    {
        return $this->studentVisits($schoolYearId)
            ->map(function (LibraryVisit $visit): array {
                $studentRegistration = $visit->visitor?->studentSchoolYearRecords
                    ?->firstWhere('school_year_id', $visit->school_year_id);

                return [
                    'visitedAt' => $visit->visited_at?->toDateString(),
                    'yearLevel' => $studentRegistration?->year_level,
                    'section' => $studentRegistration?->section,
                ];
            })
            ->values()
            ->all();
    }

    private function employeeActivityVisits(?int $schoolYearId): array
    {
        return LibraryVisit::query()
            ->with('visitor.employeeSchoolYearRecords')
            ->when($schoolYearId, fn ($query) => $query->where('school_year_id', $schoolYearId), fn ($query) => $query->whereRaw('1 = 0'))
            ->whereHas('visitor', fn ($query) => $query->where('type', LibraryMember::TYPE_EMPLOYEE))
            ->get()
            ->map(function (LibraryVisit $visit): array {
                $employeeProfile = $visit->visitor?->employeeSchoolYearRecords
                    ?->firstWhere('school_year_id', $visit->school_year_id);

                return [
                    'visitedAt' => $visit->visited_at?->toDateString(),
                    'department' => $employeeProfile?->department,
                ];
            })
            ->values()
            ->all();
    }

    private function studentVisitsByYearLevel(?int $schoolYearId): array
    {
        /** @var Collection<int, LibraryVisit> $visits */
        $visits = $this->studentVisits($schoolYearId);

        return $visits
            ->groupBy(function (LibraryVisit $visit): string {
                $studentRegistration = $visit->visitor?->studentSchoolYearRecords
                    ?->firstWhere('school_year_id', $visit->school_year_id);

                return $studentRegistration?->year_level ?? 'Unassigned';
            })
            ->map(fn (Collection $group, string $label): array => [
                'label' => $label,
                'value' => $group->count(),
            ])
            ->sortByDesc('value')
            ->values()
            ->all();
    }

    private function studentVisitsBySection(?int $schoolYearId): array
    {
        /** @var Collection<int, LibraryVisit> $visits */
        $visits = $this->studentVisits($schoolYearId);

        return $visits
            ->groupBy(function (LibraryVisit $visit): string {
                $studentRegistration = $visit->visitor?->studentSchoolYearRecords
                    ?->firstWhere('school_year_id', $visit->school_year_id);

                return trim(collect([$studentRegistration?->year_level, $studentRegistration?->section])->filter()->implode(' - ')) ?: 'Unassigned';
            })
            ->map(fn (Collection $group, string $label): array => [
                'label' => $label,
                'value' => $group->count(),
            ])
            ->sortByDesc('value')
            ->values()
            ->all();
    }

    private function employeeVisitsByDepartment(?int $schoolYearId): array
    {
        /** @var Collection<int, LibraryVisit> $visits */
        $visits = LibraryVisit::query()
            ->with('visitor.employeeSchoolYearRecords')
            ->when($schoolYearId, fn ($query) => $query->where('school_year_id', $schoolYearId), fn ($query) => $query->whereRaw('1 = 0'))
            ->whereHas('visitor', fn ($query) => $query->where('type', LibraryMember::TYPE_EMPLOYEE))
            ->get();

        return $visits
            ->groupBy(function (LibraryVisit $visit): string {
                $employeeProfile = $visit->visitor?->employeeSchoolYearRecords
                    ?->firstWhere('school_year_id', $visit->school_year_id);

                return $employeeProfile?->department ?? 'Unassigned';
            })
            ->map(fn (Collection $group, string $label): array => [
                'label' => $label,
                'value' => $group->count(),
            ])
            ->sortByDesc('value')
            ->values()
            ->all();
    }

    private function requiredProgress(?SchoolYear $schoolYear): array
    {
        if (! $schoolYear) {
            return [];
        }

        return [
            $this->requiredProgressForType($schoolYear, LibraryMember::TYPE_STUDENT, 'Students', $schoolYear->student_required_visits),
            $this->requiredProgressForType($schoolYear, LibraryMember::TYPE_EMPLOYEE, 'Employees', $schoolYear->employee_required_visits),
        ];
    }

    private function requiredProgressForType(SchoolYear $schoolYear, string $type, string $label, int $requiredVisits): array
    {
        /** @var Collection<int, LibraryMember> $visitors */
        $visitors = LibraryMember::query()
            ->where('type', $type)
            ->visitEligibleForSchoolYear($schoolYear->id)
            ->withCount([
                'visits as visits_count' => fn ($query) => $query->where('school_year_id', $schoolYear->id),
            ])
            ->get();

        $visitorCount = $visitors->count();
        $visitCount = $visitors->sum('visits_count');
        $requiredTotal = $visitorCount * $requiredVisits;

        return [
            'label' => $label,
            'required' => $requiredVisits,
            'visitors' => $visitorCount,
            'visits' => $visitCount,
            'required_total' => $requiredTotal,
            'met_required' => $requiredVisits > 0 ? $visitors->where('visits_count', '>=', $requiredVisits)->count() : 0,
            'percent' => $requiredTotal > 0 ? min(100, round(($visitCount / $requiredTotal) * 100)) : 0,
        ];
    }

    private function studentVisits(?int $schoolYearId): Collection
    {
        return LibraryVisit::query()
            ->with([
                'visitor.studentSchoolYearRecords',
            ])
            ->when($schoolYearId, fn ($query) => $query->where('school_year_id', $schoolYearId), fn ($query) => $query->whereRaw('1 = 0'))
            ->whereHas('visitor', fn ($query) => $query->where('type', LibraryMember::TYPE_STUDENT))
            ->get();
    }
}

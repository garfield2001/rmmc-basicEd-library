<?php

namespace App\Services\Dashboard;

use App\Models\LibraryVisit;
use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class AdminDashboardService
{
    public function getData(): array
    {
        $schoolYear = SchoolYear::active()->first();
        $today = Carbon::today();

        return [
            'schoolYear' => $schoolYear?->only(['id', 'name', 'minimum_visits', 'target_visits']),
            'metrics' => [
                'activeVisitors' => RegisteredVisitor::active()->visitEligibleForSchoolYear($schoolYear?->id)->count(),
                'studentRecords' => $schoolYear ? $schoolYear->studentSchoolYearRecords()->count() : 0,
                'visitsToday' => LibraryVisit::query()
                    ->whereDate('visited_at', $today)
                    ->when($schoolYear, fn ($query) => $query->where('school_year_id', $schoolYear->id), fn ($query) => $query->whereRaw('1 = 0'))
                    ->count(),
                'employeeVisitors' => RegisteredVisitor::where('type', RegisteredVisitor::TYPE_EMPLOYEE)->count(),
            ],
            'visitorBreakdown' => [
                'students' => RegisteredVisitor::where('type', RegisteredVisitor::TYPE_STUDENT)->count(),
                'employees' => RegisteredVisitor::where('type', RegisteredVisitor::TYPE_EMPLOYEE)->count(),
            ],
            'charts' => [
                'visitsByDay' => $this->visitsByDay($schoolYear?->id),
                'visitsByType' => [
                    ['label' => 'Students', 'value' => $this->visitCountByType($schoolYear?->id, RegisteredVisitor::TYPE_STUDENT)],
                    ['label' => 'Employees', 'value' => $this->visitCountByType($schoolYear?->id, RegisteredVisitor::TYPE_EMPLOYEE)],
                ],
                'studentVisitsByYearLevel' => $this->studentVisitsByYearLevel($schoolYear?->id),
            ],
        ];
    }

    private function visitsByDay(?int $schoolYearId): array
    {
        $start = now()->subDays(6)->startOfDay();
        $visits = LibraryVisit::query()
            ->where('visited_at', '>=', $start)
            ->when($schoolYearId, fn ($query) => $query->where('school_year_id', $schoolYearId), fn ($query) => $query->whereRaw('1 = 0'))
            ->get()
            ->groupBy(fn (LibraryVisit $visit): string => $visit->visited_at->toDateString());

        return collect(range(0, 6))
            ->map(function (int $daysAgo) use ($visits): array {
                $date = now()->subDays(6 - $daysAgo);

                return [
                    'label' => $date->format('M d'),
                    'value' => $visits->get($date->toDateString(), collect())->count(),
                ];
            })
            ->values()
            ->all();
    }

    private function visitCountByType(?int $schoolYearId, string $type): int
    {
        return LibraryVisit::query()
            ->when($schoolYearId, fn ($query) => $query->where('school_year_id', $schoolYearId), fn ($query) => $query->whereRaw('1 = 0'))
            ->whereHas('member', fn ($query) => $query->where('type', $type))
            ->count();
    }

    private function studentVisitsByYearLevel(?int $schoolYearId): array
    {
        /** @var Collection<int, LibraryVisit> $visits */
        $visits = LibraryVisit::query()
            ->with([
                'member.studentSchoolYearRecords',
            ])
            ->when($schoolYearId, fn ($query) => $query->where('school_year_id', $schoolYearId), fn ($query) => $query->whereRaw('1 = 0'))
            ->whereHas('member', fn ($query) => $query->where('type', RegisteredVisitor::TYPE_STUDENT))
            ->get();

        return $visits
            ->groupBy(function (LibraryVisit $visit): string {
                $studentRecord = $visit->member?->studentSchoolYearRecords
                    ?->firstWhere('school_year_id', $visit->school_year_id);

                return $studentRecord?->year_level ?? 'Unassigned';
            })
            ->map(fn (Collection $group, string $label): array => [
                'label' => $label,
                'value' => $group->count(),
            ])
            ->sortByDesc('value')
            ->values()
            ->take(6)
            ->all();
    }
}

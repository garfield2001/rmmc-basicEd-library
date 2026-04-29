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

        return [
            'schoolYear' => $schoolYear?->only(['id', 'name', 'minimum_visits', 'target_visits']),
            'metrics' => [
                'activeMembers' => LibraryMember::active()->count(),
                'inactiveMembers' => LibraryMember::where('is_active', false)->count(),
                'visitsToday' => LibraryVisit::whereDate('visited_at', $today)->count(),
                'visitsThisSchoolYear' => $schoolYear ? LibraryVisit::where('school_year_id', $schoolYear->id)->count() : 0,
            ],
            'memberBreakdown' => [
                'students' => LibraryMember::where('type', LibraryMember::TYPE_STUDENT)->count(),
                'employees' => LibraryMember::where('type', LibraryMember::TYPE_EMPLOYEE)->count(),
            ],
            'charts' => [
                'visitsByDay' => $this->visitsByDay(),
                'visitsByType' => [
                    ['label' => 'Students', 'value' => LibraryVisit::whereHas('member', fn ($query) => $query->where('type', LibraryMember::TYPE_STUDENT))->count()],
                    ['label' => 'Employees', 'value' => LibraryVisit::whereHas('member', fn ($query) => $query->where('type', LibraryMember::TYPE_EMPLOYEE))->count()],
                ],
                'studentVisitsByYearLevel' => $this->studentVisitsByYearLevel(),
            ],
        ];
    }

    private function visitsByDay(): array
    {
        $start = now()->subDays(6)->startOfDay();
        $visits = LibraryVisit::query()
            ->where('visited_at', '>=', $start)
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

    private function studentVisitsByYearLevel(): array
    {
        /** @var Collection<int, LibraryVisit> $visits */
        $visits = LibraryVisit::query()
            ->with('member.student')
            ->whereHas('member', fn ($query) => $query->where('type', LibraryMember::TYPE_STUDENT))
            ->get();

        return $visits
            ->groupBy(fn (LibraryVisit $visit): string => $visit->member?->student?->year_level ?? 'Unassigned')
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

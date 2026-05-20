<?php

namespace App\Services\Dashboard;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use Illuminate\Support\Carbon;

class AdminDashboardTrafficService
{
    public function visitsByDay(?int $schoolYearId, int $days): array
    {
        $start = now()->subDays($days - 1)->startOfDay();
        $visits = LibraryVisit::query()
            ->with('visitor:id,type')
            ->where('visited_at', '>=', $start)
            ->forRequiredSchoolYear($schoolYearId)
            ->get()
            ->groupBy(fn (LibraryVisit $visit): string => $visit->visited_at->toDateString());

        return collect(range(0, $days - 1))
            ->map(function (int $daysAgo) use ($visits, $days): array {
                $date = now()->subDays(($days - 1) - $daysAgo);

                return $this->trafficPoint($date, $visits->get($date->toDateString(), collect()));
            })
            ->values()
            ->all();
    }

    public function dailyVisits(?SchoolYear $schoolYear): array
    {
        if (! $schoolYear) {
            return [];
        }

        $start = $schoolYear->startDate()->startOfDay();
        $end = $this->dailyEndDate($schoolYear);

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
            ->map(fn (Carbon $date): array => $this->trafficPoint($date, $visits->get($date->toDateString(), collect())))
            ->values()
            ->all();
    }

    private function trafficPoint(Carbon $date, mixed $dailyVisits): array
    {
        $studentVisits = $dailyVisits->filter(fn (LibraryVisit $visit): bool => $visit->visitor?->type === LibraryMember::TYPE_STUDENT)->count();
        $employeeVisits = $dailyVisits->filter(fn (LibraryVisit $visit): bool => $visit->visitor?->type === LibraryMember::TYPE_EMPLOYEE)->count();

        return [
            'date' => $date->toDateString(),
            'label' => $date->format('M d'),
            'students' => $studentVisits,
            'employees' => $employeeVisits,
            'total' => $studentVisits + $employeeVisits,
        ];
    }

    private function dailyEndDate(SchoolYear $schoolYear): Carbon
    {
        $schoolYearEnd = $schoolYear->endDate()->startOfDay();
        $today = now()->startOfDay();

        return $schoolYearEnd->lt($today) ? $schoolYearEnd : $today;
    }
}

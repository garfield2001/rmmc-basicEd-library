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
        $aggregates = LibraryVisit::query()
            ->join('library_members', 'library_visits.library_member_id', '=', 'library_members.id')
            ->where('library_visits.visited_at', '>=', $start)
            ->forRequiredSchoolYear($schoolYearId)
            ->selectRaw('DATE(library_visits.visited_at) as visit_date')
            ->selectRaw('SUM(CASE WHEN library_members.type = ? THEN 1 ELSE 0 END) as student_count', [LibraryMember::TYPE_STUDENT])
            ->selectRaw('SUM(CASE WHEN library_members.type = ? THEN 1 ELSE 0 END) as employee_count', [LibraryMember::TYPE_EMPLOYEE])
            ->groupByRaw('DATE(library_visits.visited_at)')
            ->get()
            ->keyBy('visit_date');

        return collect(range(0, $days - 1))
            ->map(function (int $daysAgo) use ($aggregates, $days): array {
                $date = now()->subDays(($days - 1) - $daysAgo);
                $dateKey = $date->toDateString();
                $record = $aggregates->get($dateKey);

                $studentVisits = (int) ($record?->student_count ?? 0);
                $employeeVisits = (int) ($record?->employee_count ?? 0);

                return [
                    'date' => $dateKey,
                    'label' => $date->format('M d'),
                    'students' => $studentVisits,
                    'employees' => $employeeVisits,
                    'total' => $studentVisits + $employeeVisits,
                ];
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

        $aggregates = LibraryVisit::query()
            ->join('library_members', 'library_visits.library_member_id', '=', 'library_members.id')
            ->where('library_visits.school_year_id', $schoolYear->id)
            ->whereBetween('library_visits.visited_at', [$start, $end->copy()->endOfDay()])
            ->selectRaw('DATE(library_visits.visited_at) as visit_date')
            ->selectRaw('SUM(CASE WHEN library_members.type = ? THEN 1 ELSE 0 END) as student_count', [LibraryMember::TYPE_STUDENT])
            ->selectRaw('SUM(CASE WHEN library_members.type = ? THEN 1 ELSE 0 END) as employee_count', [LibraryMember::TYPE_EMPLOYEE])
            ->groupByRaw('DATE(library_visits.visited_at)')
            ->get()
            ->keyBy('visit_date');

        return collect($start->daysUntil($end->copy()->addDay()))
            ->map(function (Carbon $date) use ($aggregates): array {
                $dateKey = $date->toDateString();
                $record = $aggregates->get($dateKey);

                $studentVisits = (int) ($record?->student_count ?? 0);
                $employeeVisits = (int) ($record?->employee_count ?? 0);

                return [
                    'date' => $dateKey,
                    'label' => $date->format('M d'),
                    'students' => $studentVisits,
                    'employees' => $employeeVisits,
                    'total' => $studentVisits + $employeeVisits,
                ];
            })
            ->values()
            ->all();
    }

    private function dailyEndDate(SchoolYear $schoolYear): Carbon
    {
        $schoolYearEnd = $schoolYear->endDate()->startOfDay();
        $today = now()->startOfDay();

        return $schoolYearEnd->lt($today) ? $schoolYearEnd : $today;
    }
}

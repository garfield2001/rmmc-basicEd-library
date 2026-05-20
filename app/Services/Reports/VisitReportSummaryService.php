<?php

namespace App\Services\Reports;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use Illuminate\Support\Collection;

class VisitReportSummaryService
{
    public function requiredVisitsForType(?SchoolYear $schoolYear, string $visitorType): int
    {
        if (! $schoolYear) {
            return 0;
        }

        return $visitorType === LibraryMember::TYPE_EMPLOYEE
            ? $schoolYear->employee_required_visits
            : $schoolYear->student_required_visits;
    }

    /**
     * @param  Collection<int, LibraryMember>  $visitors
     */
    public function fromVisitors(Collection $visitors, string $visitorType, int $requiredVisits): array
    {
        $visitorCount = $visitors->count();
        $totalVisits = $visitors->sum('visits_count');
        $visitedVisitors = $visitors->where('visits_count', '>', 0)->count();
        $requiredVisitTotal = $visitorCount * $requiredVisits;

        return [
            'visitor_type' => $visitorType,
            'visitors' => $visitorCount,
            'total_visits' => $totalVisits,
            'visited_visitors' => $visitedVisitors,
            'unvisited_visitors' => max(0, $visitorCount - $visitedVisitors),
            'met_required' => $requiredVisits > 0 ? $visitors->where('visits_count', '>=', $requiredVisits)->count() : 0,
            'average_visits' => $visitorCount > 0 ? round($totalVisits / $visitorCount, 1) : 0,
            'required_visits' => $requiredVisits,
            'excess_visits' => $visitors->sum(fn (LibraryMember $visitor): int => max(0, (int) $visitor->visits_count - $requiredVisits)),
            'progress_percent' => $requiredVisitTotal > 0 ? min(100, round(($totalVisits / $requiredVisitTotal) * 100)) : 0,
        ];
    }
}

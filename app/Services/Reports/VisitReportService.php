<?php

namespace App\Services\Reports;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use Illuminate\Support\Carbon;

class VisitReportService
{
    public function __construct(
        private readonly VisitReportRowService $rows,
        private readonly VisitReportSummaryService $summary,
        private readonly VisitReportVisitorQuery $visitors,
    ) {}

    public function getData(array $filters = []): array
    {
        $schoolYear = $this->resolveSchoolYear($filters);
        [$startDate, $endDate] = $this->resolveDateRange($filters, $schoolYear);
        $schoolYearId = $schoolYear?->id;
        $visitorType = $filters['visitor_type'] ?? LibraryMember::TYPE_STUDENT;
        $yearLevel = $filters['year_level'] ?? null;
        $section = $filters['section'] ?? null;
        $department = $filters['department'] ?? null;
        $requiredVisits = $this->summary->requiredVisitsForType($schoolYear, $visitorType);

        $visitors = $this->visitors->get($schoolYear, $startDate, $endDate, $visitorType, $yearLevel, $section, $department);

        $rows = $visitors
            ->map(fn (LibraryMember $visitor): array => $this->rows->visitorRow($visitor, $requiredVisits))
            ->sort(fn (array $first, array $second): int => $this->rows->compare($first, $second, $visitorType, $yearLevel))
            ->values();

        return [
            'filters' => [
                'school_year_id' => $schoolYearId,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'visitor_type' => $visitorType,
                'year_level' => $visitorType === LibraryMember::TYPE_STUDENT ? $yearLevel : null,
                'section' => $visitorType === LibraryMember::TYPE_STUDENT ? $section : null,
                'department' => $visitorType === LibraryMember::TYPE_EMPLOYEE ? $department : null,
            ],
            'school_year' => $schoolYear ? $this->schoolYearData($schoolYear) : null,
            'summary' => $this->summary->fromVisitors($visitors, $visitorType, $requiredVisits),
            'rows' => $rows,
        ];
    }

    private function resolveSchoolYear(array $filters): ?SchoolYear
    {
        if (isset($filters['school_year_id'])) {
            return SchoolYear::query()->find($filters['school_year_id']);
        }

        return SchoolYear::active()->first();
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveDateRange(array $filters, ?SchoolYear $schoolYear): array
    {
        $startDate = isset($filters['start_date'])
            ? Carbon::parse($filters['start_date'])->startOfDay()
            : ($schoolYear?->startDate()->startOfDay() ?? now()->startOfMonth());

        $endDate = isset($filters['end_date'])
            ? Carbon::parse($filters['end_date'])->endOfDay()
            : ($schoolYear?->endDate()->endOfDay() ?? now()->endOfDay());

        if ($schoolYear) {
            $schoolYearStart = $schoolYear->startDate()->startOfDay();
            $schoolYearEnd = $schoolYear->endDate()->endOfDay();
            $startDate = $startDate->lt($schoolYearStart) ? $schoolYearStart : $startDate;
            $endDate = $endDate->gt($schoolYearEnd) ? $schoolYearEnd : $endDate;
        }

        if ($startDate->gt($endDate)) {
            $endDate = $startDate->copy()->endOfDay();
        }

        return [$startDate, $endDate];
    }

    private function schoolYearData(SchoolYear $schoolYear): array
    {
        return [
            'id' => $schoolYear->id,
            'name' => $schoolYear->name,
            'starts_at' => $schoolYear->startDateString(),
            'ends_at' => $schoolYear->endDateString(),
            'student_required_visits' => $schoolYear->student_required_visits,
            'employee_required_visits' => $schoolYear->employee_required_visits,
            'is_active' => $schoolYear->is_active,
        ];
    }
}

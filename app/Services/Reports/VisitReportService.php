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
        $yearLevels = $this->selectedValues($filters['year_levels'] ?? [], $yearLevel);
        $sections = $this->selectedValues($filters['sections'] ?? [], $section);
        $departments = $this->selectedValues($filters['departments'] ?? [], $department);
        $requiredVisits = $this->summary->requiredVisitsForType($schoolYear, $visitorType);

        $visitors = $this->visitors->get($schoolYear, $startDate, $endDate, $visitorType, $yearLevels, $sections, $departments);

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
                'year_levels' => $visitorType === LibraryMember::TYPE_STUDENT ? $yearLevels : [],
                'sections' => $visitorType === LibraryMember::TYPE_STUDENT ? $sections : [],
                'departments' => $visitorType === LibraryMember::TYPE_EMPLOYEE ? $departments : [],
            ],
            'school_year' => $schoolYear ? $this->schoolYearData($schoolYear) : null,
            'summary' => $this->summary->fromVisitors($visitors, $visitorType, $requiredVisits),
            'rows' => $rows,
        ];
    }

    private function selectedValues(mixed $values, ?string $fallback): array
    {
        $selected = is_array($values) ? $values : [];

        if ($selected === [] && $fallback) {
            $selected = [$fallback];
        }

        return collect($selected)
            ->filter(fn ($value): bool => is_string($value) && trim($value) !== '' && trim($value) !== '__all__')
            ->map(fn (string $value): string => trim($value))
            ->unique()
            ->values()
            ->all();
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

    public function getReportOptions(\App\Services\SchoolYears\SchoolYearSectionService $sections, ?int $activeSchoolYearId): array
    {
        return [
            'schoolYears' => SchoolYear::query()
                ->orderByDesc('starts_at')
                ->get(['id', 'name', 'starts_at', 'ends_at', 'student_required_visits', 'employee_required_visits', 'is_active'])
                ->map(fn (SchoolYear $schoolYear): array => [
                    'id' => $schoolYear->id,
                    'name' => $schoolYear->name,
                    'starts_at' => $schoolYear->startDateString(),
                    'ends_at' => $schoolYear->endDateString(),
                    'student_required_visits' => $schoolYear->student_required_visits,
                    'employee_required_visits' => $schoolYear->employee_required_visits,
                    'is_active' => $schoolYear->is_active,
                ]),
            'yearLevels' => \App\Support\Academics\AcademicLevels::options(),
            'sectionsByYearLevel' => $sections->groupedByYearLevel($activeSchoolYearId ?: SchoolYear::active()->value('id')),
            'sectionsBySchoolYear' => $sections->groupedBySchoolYear(),
            'departments' => \App\Models\EmployeeSchoolYearRecord::query()
                ->when($activeSchoolYearId, fn ($query, $schoolYearId) => $query->where('school_year_id', $schoolYearId))
                ->whereNotNull('department')
                ->distinct()
                ->orderBy('department')
                ->pluck('department')
                ->values(),
        ];
    }
}

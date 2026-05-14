<?php

namespace App\Services\Reports;

use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\StudentRegistration;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class VisitReportService
{
    public function getData(array $filters = []): array
    {
        $schoolYear = $this->resolveSchoolYear($filters);
        [$startDate, $endDate] = $this->resolveDateRange($filters, $schoolYear);
        $schoolYearId = $schoolYear?->id;
        $visitorType = $filters['visitor_type'] ?? RegisteredVisitor::TYPE_STUDENT;
        $yearLevel = $filters['year_level'] ?? null;
        $section = $filters['section'] ?? null;
        $department = $filters['department'] ?? null;
        $requiredVisits = $this->requiredVisitsForType($schoolYear, $visitorType);

        /** @var Collection<int, RegisteredVisitor> $visitors */
        $visitors = RegisteredVisitor::query()
            ->with([
                'employee' => fn ($query) => $query->forSchoolYear($schoolYearId),
                'studentRegistrations' => fn ($query) => $query->forSchoolYear($schoolYearId),
            ])
            ->withCount([
                'visits as visits_count' => fn ($query) => $query
                    ->whereBetween('visited_at', [$startDate, $endDate])
                    ->when($schoolYearId, fn ($query) => $query->where('school_year_id', $schoolYearId), fn ($query) => $query->whereRaw('1 = 0')),
            ])
            ->withMax([
                'visits as last_visit_at' => fn ($query) => $query
                    ->whereBetween('visited_at', [$startDate, $endDate])
                    ->when($schoolYearId, fn ($query) => $query->where('school_year_id', $schoolYearId), fn ($query) => $query->whereRaw('1 = 0')),
            ], 'visited_at')
            ->where('type', $visitorType)
            ->when(
                $visitorType === RegisteredVisitor::TYPE_STUDENT,
                fn (Builder $query) => $query
                    ->when($schoolYearId, fn (Builder $query) => $query->whereHas(
                        'studentRegistrations',
                        fn (Builder $query) => $query
                            ->forSchoolYear($schoolYearId)
                            ->when($yearLevel, fn (Builder $query) => $query->where('year_level', $yearLevel))
                            ->when($section, fn (Builder $query) => $query->where('section', $section)),
                    ), fn (Builder $query) => $query->whereRaw('1 = 0')),
            )
            ->when(
                $visitorType === RegisteredVisitor::TYPE_EMPLOYEE,
                fn (Builder $query) => $query->when($schoolYearId, fn (Builder $query) => $query->whereHas(
                    'employeeProfiles',
                    fn (Builder $query) => $query
                        ->forSchoolYear($schoolYearId)
                        ->when($department, fn (Builder $query) => $query->where('department', $department)),
                ), fn (Builder $query) => $query->whereRaw('1 = 0')),
            )
            ->orderByDesc('visits_count')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $totalVisits = $visitors->sum('visits_count');
        $visitorCount = $visitors->count();
        $visitedVisitors = $visitors->where('visits_count', '>', 0)->count();
        $requiredVisitTotal = $visitorCount * $requiredVisits;

        return [
            'filters' => [
                'school_year_id' => $schoolYearId,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'visitor_type' => $visitorType,
                'year_level' => $visitorType === RegisteredVisitor::TYPE_STUDENT ? $yearLevel : null,
                'section' => $visitorType === RegisteredVisitor::TYPE_STUDENT ? $section : null,
                'department' => $visitorType === RegisteredVisitor::TYPE_EMPLOYEE ? $department : null,
            ],
            'school_year' => $schoolYear ? $this->schoolYearData($schoolYear) : null,
            'summary' => [
                'visitor_type' => $visitorType,
                'visitors' => $visitorCount,
                'total_visits' => $totalVisits,
                'visited_visitors' => $visitedVisitors,
                'unvisited_visitors' => max(0, $visitorCount - $visitedVisitors),
                'met_required' => $requiredVisits > 0 ? $visitors->where('visits_count', '>=', $requiredVisits)->count() : 0,
                'average_visits' => $visitorCount > 0 ? round($totalVisits / $visitorCount, 1) : 0,
                'required_visits' => $requiredVisits,
                'progress_percent' => $requiredVisitTotal > 0 ? min(100, round(($totalVisits / $requiredVisitTotal) * 100)) : 0,
            ],
            'rows' => $visitors->map(fn (RegisteredVisitor $visitor): array => $this->visitorRow($visitor, $requiredVisits))->values(),
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
            : ($schoolYear?->starts_at?->copy()->startOfDay() ?? now()->startOfMonth());

        $endDate = isset($filters['end_date'])
            ? Carbon::parse($filters['end_date'])->endOfDay()
            : ($schoolYear?->ends_at?->copy()->endOfDay() ?? now()->endOfDay());

        if ($schoolYear) {
            $schoolYearStart = $schoolYear->starts_at->copy()->startOfDay();
            $schoolYearEnd = $schoolYear->ends_at->copy()->endOfDay();
            $startDate = $startDate->lt($schoolYearStart) ? $schoolYearStart : $startDate;
            $endDate = $endDate->gt($schoolYearEnd) ? $schoolYearEnd : $endDate;
        }

        if ($startDate->gt($endDate)) {
            $endDate = $startDate->copy()->endOfDay();
        }

        return [$startDate, $endDate];
    }

    private function studentRegistrationForVisitor(RegisteredVisitor $visitor): ?StudentRegistration
    {
        return $visitor->studentRegistrations->first();
    }

    private function visitorRow(RegisteredVisitor $visitor, int $requiredVisits): array
    {
        $studentRegistration = $this->studentRegistrationForVisitor($visitor);
        $employeeProfile = $visitor->employee;
        $snapshot = $visitor->type === RegisteredVisitor::TYPE_STUDENT ? $studentRegistration : $employeeProfile;

        return [
            'id' => $visitor->id,
            'school_id' => $snapshot?->school_id ?? $visitor->school_id,
            'name' => $this->snapshotName($snapshot, $visitor),
            'type' => $visitor->type,
            'department' => $visitor->type === RegisteredVisitor::TYPE_EMPLOYEE ? $employeeProfile?->department : null,
            'year_level' => $visitor->type === RegisteredVisitor::TYPE_STUDENT ? $studentRegistration?->year_level : null,
            'section' => $visitor->type === RegisteredVisitor::TYPE_STUDENT ? $studentRegistration?->section : null,
            'visit_count' => (int) $visitor->visits_count,
            'required_met' => $requiredVisits > 0 && $visitor->visits_count >= $requiredVisits,
            'progress_percent' => $requiredVisits > 0 ? min(100, round(($visitor->visits_count / $requiredVisits) * 100)) : 0,
            'last_visit_at' => $visitor->last_visit_at ? Carbon::parse($visitor->last_visit_at)->format('Y-m-d H:i:s') : null,
        ];
    }

    private function snapshotName(mixed $snapshot, RegisteredVisitor $visitor): string
    {
        if (! $snapshot?->first_name || ! $snapshot?->last_name) {
            return $visitor->full_name;
        }

        $middleInitial = $snapshot->middle_name
            ? strtoupper(substr(trim($snapshot->middle_name), 0, 1)).'.'
            : null;

        return trim(collect([$snapshot->first_name, $middleInitial, $snapshot->last_name])->filter()->implode(' '));
    }

    private function schoolYearData(SchoolYear $schoolYear): array
    {
        return [
            'id' => $schoolYear->id,
            'name' => $schoolYear->name,
            'starts_at' => $schoolYear->starts_at->toDateString(),
            'ends_at' => $schoolYear->ends_at->toDateString(),
            'student_required_visits' => $schoolYear->student_required_visits,
            'employee_required_visits' => $schoolYear->employee_required_visits,
            'is_active' => $schoolYear->is_active,
        ];
    }

    private function requiredVisitsForType(?SchoolYear $schoolYear, string $visitorType): int
    {
        if (! $schoolYear) {
            return 0;
        }

        return $visitorType === RegisteredVisitor::TYPE_EMPLOYEE
            ? $schoolYear->employee_required_visits
            : $schoolYear->student_required_visits;
    }
}

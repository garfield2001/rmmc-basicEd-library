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
        $visitorStatus = $filters['visitor_status'] ?? null;
        $yearLevel = $filters['year_level'] ?? null;
        $section = $filters['section'] ?? null;
        $department = $filters['department'] ?? null;
        $minimumVisits = $schoolYear?->minimum_visits ?? 0;
        $targetVisits = $schoolYear?->target_visits ?? 0;

        /** @var Collection<int, RegisteredVisitor> $visitors */
        $visitors = RegisteredVisitor::query()
            ->when($schoolYear && ! $schoolYear->is_active, fn (Builder $query) => $query->withTrashed())
            ->with([
                'employee',
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
            ->when($visitorStatus, fn (Builder $query) => $query->where('is_active', $visitorStatus === 'active'))
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
                $visitorType === RegisteredVisitor::TYPE_EMPLOYEE && $department,
                fn (Builder $query) => $query->whereHas('employee', fn (Builder $query) => $query->where('department', $department)),
            )
            ->orderByDesc('visits_count')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $totalVisits = $visitors->sum('visits_count');
        $visitorCount = $visitors->count();
        $visitedVisitors = $visitors->where('visits_count', '>', 0)->count();
        $targetVisitTotal = $visitorCount * $targetVisits;

        return [
            'filters' => [
                'school_year_id' => $schoolYearId,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'visitor_type' => $visitorType,
                'visitor_status' => $visitorStatus,
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
                'met_minimum' => $minimumVisits > 0 ? $visitors->where('visits_count', '>=', $minimumVisits)->count() : 0,
                'met_target' => $targetVisits > 0 ? $visitors->where('visits_count', '>=', $targetVisits)->count() : 0,
                'average_visits' => $visitorCount > 0 ? round($totalVisits / $visitorCount, 1) : 0,
                'minimum_visits' => $minimumVisits,
                'target_visits' => $targetVisits,
                'progress_percent' => $targetVisitTotal > 0 ? min(100, round(($totalVisits / $targetVisitTotal) * 100)) : 0,
            ],
            'rows' => $visitors->map(fn (RegisteredVisitor $visitor): array => [
                'id' => $visitor->id,
                'school_id' => $visitor->school_id,
                'name' => $visitor->full_name,
                'type' => $visitor->type,
                'status' => $visitor->is_active && ! $visitor->trashed() ? 'active' : 'inactive',
                'department' => $visitor->type === RegisteredVisitor::TYPE_EMPLOYEE ? $visitor->employee?->department : null,
                'year_level' => $visitor->type === RegisteredVisitor::TYPE_STUDENT ? $this->studentRegistrationForVisitor($visitor)?->year_level : null,
                'section' => $visitor->type === RegisteredVisitor::TYPE_STUDENT ? $this->studentRegistrationForVisitor($visitor)?->section : null,
                'visit_count' => (int) $visitor->visits_count,
                'minimum_met' => $minimumVisits > 0 && $visitor->visits_count >= $minimumVisits,
                'target_met' => $targetVisits > 0 && $visitor->visits_count >= $targetVisits,
                'progress_percent' => $targetVisits > 0 ? min(100, round(($visitor->visits_count / $targetVisits) * 100)) : 0,
                'last_visit_at' => $visitor->last_visit_at ? Carbon::parse($visitor->last_visit_at)->format('Y-m-d H:i:s') : null,
            ])->values(),
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

    private function schoolYearData(SchoolYear $schoolYear): array
    {
        return [
            'id' => $schoolYear->id,
            'name' => $schoolYear->name,
            'starts_at' => $schoolYear->starts_at->toDateString(),
            'ends_at' => $schoolYear->ends_at->toDateString(),
            'minimum_visits' => $schoolYear->minimum_visits,
            'target_visits' => $schoolYear->target_visits,
            'is_active' => $schoolYear->is_active,
        ];
    }
}

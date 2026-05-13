<?php

namespace App\Services\Reports;

use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\StudentSchoolYearRecord;
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
        $memberType = $filters['member_type'] ?? RegisteredVisitor::TYPE_STUDENT;
        $memberStatus = $filters['member_status'] ?? null;
        $yearLevel = $filters['year_level'] ?? null;
        $section = $filters['section'] ?? null;
        $department = $filters['department'] ?? null;
        $minimumVisits = $schoolYear?->minimum_visits ?? 0;
        $targetVisits = $schoolYear?->target_visits ?? 0;

        /** @var Collection<int, RegisteredVisitor> $members */
        $members = RegisteredVisitor::query()
            ->when($schoolYear && ! $schoolYear->is_active, fn (Builder $query) => $query->withTrashed())
            ->with([
                'employee',
                'studentSchoolYearRecords' => fn ($query) => $query->forSchoolYear($schoolYearId),
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
            ->where('type', $memberType)
            ->when($memberStatus, fn (Builder $query) => $query->where('is_active', $memberStatus === 'active'))
            ->when(
                $memberType === RegisteredVisitor::TYPE_STUDENT,
                fn (Builder $query) => $query
                    ->when($schoolYearId, fn (Builder $query) => $query->whereHas(
                        'studentSchoolYearRecords',
                        fn (Builder $query) => $query
                            ->forSchoolYear($schoolYearId)
                            ->when($yearLevel, fn (Builder $query) => $query->where('year_level', $yearLevel))
                            ->when($section, fn (Builder $query) => $query->where('section', $section)),
                    ), fn (Builder $query) => $query->whereRaw('1 = 0')),
            )
            ->when(
                $memberType === RegisteredVisitor::TYPE_EMPLOYEE && $department,
                fn (Builder $query) => $query->whereHas('employee', fn (Builder $query) => $query->where('department', $department)),
            )
            ->orderByDesc('visits_count')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $totalVisits = $members->sum('visits_count');
        $memberCount = $members->count();
        $visitedMembers = $members->where('visits_count', '>', 0)->count();
        $targetVisitTotal = $memberCount * $targetVisits;

        return [
            'filters' => [
                'school_year_id' => $schoolYearId,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'member_type' => $memberType,
                'member_status' => $memberStatus,
                'year_level' => $memberType === RegisteredVisitor::TYPE_STUDENT ? $yearLevel : null,
                'section' => $memberType === RegisteredVisitor::TYPE_STUDENT ? $section : null,
                'department' => $memberType === RegisteredVisitor::TYPE_EMPLOYEE ? $department : null,
            ],
            'school_year' => $schoolYear ? $this->schoolYearData($schoolYear) : null,
            'summary' => [
                'member_type' => $memberType,
                'members' => $memberCount,
                'total_visits' => $totalVisits,
                'visited_members' => $visitedMembers,
                'unvisited_members' => max(0, $memberCount - $visitedMembers),
                'met_minimum' => $minimumVisits > 0 ? $members->where('visits_count', '>=', $minimumVisits)->count() : 0,
                'met_target' => $targetVisits > 0 ? $members->where('visits_count', '>=', $targetVisits)->count() : 0,
                'average_visits' => $memberCount > 0 ? round($totalVisits / $memberCount, 1) : 0,
                'minimum_visits' => $minimumVisits,
                'target_visits' => $targetVisits,
                'progress_percent' => $targetVisitTotal > 0 ? min(100, round(($totalVisits / $targetVisitTotal) * 100)) : 0,
            ],
            'rows' => $members->map(fn (RegisteredVisitor $member): array => [
                'id' => $member->id,
                'school_id' => $member->school_id,
                'name' => $member->full_name,
                'type' => $member->type,
                'status' => $member->is_active && ! $member->trashed() ? 'active' : 'inactive',
                'department' => $member->type === RegisteredVisitor::TYPE_EMPLOYEE ? $member->employee?->department : null,
                'year_level' => $member->type === RegisteredVisitor::TYPE_STUDENT ? $this->StudentSchoolYearRecordForMember($member)?->year_level : null,
                'section' => $member->type === RegisteredVisitor::TYPE_STUDENT ? $this->StudentSchoolYearRecordForMember($member)?->section : null,
                'visit_count' => (int) $member->visits_count,
                'minimum_met' => $minimumVisits > 0 && $member->visits_count >= $minimumVisits,
                'target_met' => $targetVisits > 0 && $member->visits_count >= $targetVisits,
                'progress_percent' => $targetVisits > 0 ? min(100, round(($member->visits_count / $targetVisits) * 100)) : 0,
                'last_visit_at' => $member->last_visit_at ? Carbon::parse($member->last_visit_at)->format('Y-m-d H:i:s') : null,
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

    private function StudentSchoolYearRecordForMember(RegisteredVisitor $member): ?StudentSchoolYearRecord
    {
        return $member->studentSchoolYearRecords->first();
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

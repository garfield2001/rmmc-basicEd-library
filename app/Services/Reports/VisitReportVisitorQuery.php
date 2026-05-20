<?php

namespace App\Services\Reports;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class VisitReportVisitorQuery
{
    /**
     * @return Collection<int, LibraryMember>
     */
    public function get(
        ?SchoolYear $schoolYear,
        Carbon $startDate,
        Carbon $endDate,
        string $visitorType,
        ?string $yearLevel,
        ?string $section,
        ?string $department,
    ): Collection {
        $schoolYearId = $schoolYear?->id;

        return LibraryMember::query()
            ->with([
                'employee' => fn ($query) => $query->forSchoolYear($schoolYearId),
                'studentSchoolYearRecords' => fn ($query) => $query->forSchoolYear($schoolYearId),
                'visits' => fn ($query) => $query
                    ->select('id', 'library_member_id', 'school_year_id', 'visited_at')
                    ->whereBetween('visited_at', [$schoolYear?->startDate()->startOfDay() ?? $startDate, $this->historyEndDate($endDate, $schoolYear)])
                    ->forRequiredSchoolYear($schoolYearId)
                    ->latest('visited_at'),
            ])
            ->withCount([
                'visits as visits_count' => fn ($query) => $query
                    ->whereBetween('visited_at', [$startDate, $endDate])
                    ->forRequiredSchoolYear($schoolYearId),
            ])
            ->withMax([
                'visits as last_visit_at' => fn ($query) => $query
                    ->whereBetween('visited_at', [$startDate, $endDate])
                    ->forRequiredSchoolYear($schoolYearId),
            ], 'visited_at')
            ->where('type', $visitorType)
            ->when($visitorType === LibraryMember::TYPE_STUDENT, fn (Builder $query) => $this->studentFilter($query, $schoolYearId, $yearLevel, $section))
            ->when($visitorType === LibraryMember::TYPE_EMPLOYEE, fn (Builder $query) => $this->employeeFilter($query, $schoolYearId, $department))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();
    }

    private function studentFilter(Builder $query, ?int $schoolYearId, ?string $yearLevel, ?string $section): Builder
    {
        return $query->when($schoolYearId, fn (Builder $query) => $query->whereHas(
            'studentSchoolYearRecords',
            fn (Builder $query) => $query
                ->forSchoolYear($schoolYearId)
                ->when($yearLevel, fn (Builder $query) => $query->where('year_level', $yearLevel))
                ->when($section, fn (Builder $query) => $query->where('section', $section)),
        ), fn (Builder $query) => $query->whereKey([]));
    }

    private function employeeFilter(Builder $query, ?int $schoolYearId, ?string $department): Builder
    {
        return $query->when($schoolYearId, fn (Builder $query) => $query->whereHas(
            'employeeSchoolYearRecords',
            fn (Builder $query) => $query
                ->forSchoolYear($schoolYearId)
                ->when($department, fn (Builder $query) => $query->where('department', $department)),
        ), fn (Builder $query) => $query->whereKey([]));
    }

    private function historyEndDate(Carbon $reportEndDate, ?SchoolYear $schoolYear): Carbon
    {
        $today = now()->endOfDay();
        $schoolYearEnd = $schoolYear?->endDate()->endOfDay();
        $endDate = $reportEndDate->copy();

        if ($schoolYearEnd && $schoolYearEnd->lt($endDate)) {
            $endDate = $schoolYearEnd;
        }

        return $today->lt($endDate) ? $today : $endDate;
    }
}

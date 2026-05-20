<?php

namespace App\Services\Dashboard;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Services\Settings\LibraryScanSettingsService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class AdminVisitMonitorService
{
    public function __construct(
        private readonly AdminVisitHistoryService $history,
        private readonly AdminVisitPayloadService $payloads,
        private readonly LibraryScanSettingsService $scanSettings,
        private readonly AdminScanTargetSearchService $scanTargets,
    ) {}

    public function getData(): array
    {
        $scanWindow = $this->scanSettings->scanWindow();
        $schoolYearId = SchoolYear::active()->value('id');
        $todayVisitQuery = $this->todayVisitQuery($schoolYearId, $scanWindow['starts_at']);

        return [
            'scanWindow' => $scanWindow,
            'metrics' => [
                'visitsToday' => (clone $todayVisitQuery)->count(),
                'studentVisitsToday' => $this->todayVisitsByType($todayVisitQuery, LibraryMember::TYPE_STUDENT),
                'employeeVisitsToday' => $this->todayVisitsByType($todayVisitQuery, LibraryMember::TYPE_EMPLOYEE),
            ],
            'todayVisits' => $this->todayVisits($schoolYearId, $scanWindow['starts_at']),
            'scanTargets' => [],
        ];
    }

    public function getHistoryData(): array
    {
        return $this->history->getData();
    }

    public function searchScanTargets(string $search, int $limit = 8): array
    {
        return $this->scanTargets->search($search, $limit);
    }

    private function todayVisits(?int $schoolYearId, string $scanStartTime): mixed
    {
        return LibraryVisit::query()
            ->with([
                'visitor:id,school_id,type,first_name,middle_name,last_name,photo',
                'visitor.student' => AdminVisitRelations::student($schoolYearId),
                'visitor.employee' => AdminVisitRelations::employee($schoolYearId),
            ])
            ->where('visited_at', '>=', $this->todayScanStartsAt($scanStartTime))
            ->forRequiredSchoolYear($schoolYearId)
            ->latest('visited_at')
            ->get()
            ->map(fn (LibraryVisit $visit): array => $this->payloads->visitData($visit));
    }

    private function todayVisitQuery(?int $schoolYearId, string $scanStartTime): Builder
    {
        return LibraryVisit::query()
            ->where('visited_at', '>=', $this->todayScanStartsAt($scanStartTime))
            ->forRequiredSchoolYear($schoolYearId);
    }

    private function todayVisitsByType(Builder $todayVisitQuery, string $type): int
    {
        return (clone $todayVisitQuery)
            ->whereHas('visitor', fn (Builder $query) => $query->where('type', $type))
            ->count();
    }

    private function todayScanStartsAt(string $time): Carbon
    {
        [$hour, $minute] = array_map('intval', explode(':', $time));

        return Carbon::today()->setTime($hour, $minute);
    }
}

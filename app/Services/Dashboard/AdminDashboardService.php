<?php

namespace App\Services\Dashboard;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Services\Settings\LibraryScanSettingsService;
use Illuminate\Support\Carbon;

class AdminDashboardService
{
    public function __construct(
        private readonly AdminDashboardActivityService $activity,
        private readonly AdminDashboardProgressService $progress,
        private readonly LibraryScanSettingsService $scanSettings,
        private readonly AdminDashboardTrafficService $traffic,
    ) {}

    public function getData(): array
    {
        $schoolYear = SchoolYear::active()->first();
        $schoolYearId = $schoolYear?->id;
        $scanWindow = $this->scanSettings->scanWindow();
        $studentVisitors = $this->visitorCount(LibraryMember::TYPE_STUDENT, $schoolYearId);
        $employeeVisitors = $this->visitorCount(LibraryMember::TYPE_EMPLOYEE, $schoolYearId);

        return [
            'scanWindow' => $scanWindow,
            'scanSettings' => $this->scanSettings->toPageProps(),
            'schoolYear' => $schoolYear ? $this->schoolYearData($schoolYear) : null,
            'metrics' => [
                'registeredVisitors' => $studentVisitors + $employeeVisitors,
                'studentSchoolYearRecords' => $schoolYear ? $schoolYear->studentSchoolYearRecords()->count() : 0,
                'visitsToday' => $this->visitsToday($schoolYearId, $scanWindow['starts_at']),
                'employeeVisitors' => $employeeVisitors,
            ],
            'visitorBreakdown' => ['students' => $studentVisitors, 'employees' => $employeeVisitors],
            'charts' => [
                'visitsByDay' => [
                    'last7' => $this->traffic->visitsByDay($schoolYearId, 7),
                    'last14' => $this->traffic->visitsByDay($schoolYearId, 14),
                    'lastMonth' => $this->traffic->visitsByDay($schoolYearId, 30),
                ],
                'dailyVisits' => $this->traffic->dailyVisits($schoolYear),
                'studentActivityVisits' => $this->activity->studentActivityVisits($schoolYearId),
                'employeeActivityVisits' => $this->activity->employeeActivityVisits($schoolYearId),
                'activityGroups' => $this->activity->groups($schoolYearId),
                'studentVisitsByYearLevel' => $this->activity->studentVisitsByYearLevel($schoolYearId),
                'studentVisitsBySection' => $this->activity->studentVisitsBySection($schoolYearId),
                'employeeVisitsByDepartment' => $this->activity->employeeVisitsByDepartment($schoolYearId),
                'requiredProgress' => $this->progress->requiredProgress($schoolYear),
                'individualProgress' => $this->progress->individualProgress($schoolYear),
            ],
        ];
    }

    private function visitorCount(string $type, ?int $schoolYearId): int
    {
        return LibraryMember::where('type', $type)->visitEligibleForSchoolYear($schoolYearId)->count();
    }

    private function visitsToday(?int $schoolYearId, string $scanStartTime): int
    {
        return LibraryVisit::query()
            ->where('visited_at', '>=', $this->todayScanStartsAt($scanStartTime))
            ->forRequiredSchoolYear($schoolYearId)
            ->count();
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
        ];
    }

    private function todayScanStartsAt(string $time): Carbon
    {
        [$hour, $minute] = array_map('intval', explode(':', $time));

        return Carbon::today()->setTime($hour, $minute);
    }
}

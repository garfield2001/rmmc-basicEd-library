<?php

namespace App\Services\Home;

use App\Models\LibraryVisit;
use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Services\Settings\LibraryScanSettingsService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class HomePageService
{
    public function __construct(private readonly LibraryScanSettingsService $scanSettings) {}

    public function data(): array
    {
        $schoolYear = SchoolYear::active()
            ->first(['id', 'name']);

        $today = Carbon::today();

        $todayVisits = LibraryVisit::query()
            ->whereDate('visited_at', $today)
            ->when($schoolYear, fn (Builder $query) => $query->where('school_year_id', $schoolYear->id), fn (Builder $query) => $query->whereRaw('1 = 0'));

        return [
            'schoolYear' => $schoolYear?->only(['id', 'name']),
            'scanSettings' => $this->scanSettings->toPageProps(),

            'metrics' => [
                'students' => RegisteredVisitor::active()
                    ->where('type', RegisteredVisitor::TYPE_STUDENT)
                    ->visitEligibleForSchoolYear($schoolYear?->id)
                    ->count(),

                'employees' => RegisteredVisitor::active()
                    ->where('type', RegisteredVisitor::TYPE_EMPLOYEE)
                    ->count(),

                'visitsToday' => (clone $todayVisits)->count(),

                'studentVisitsToday' => (clone $todayVisits)
                    ->whereHas('visitor', function (Builder $query): void {
                        $query->where('type', RegisteredVisitor::TYPE_STUDENT);
                    })
                    ->count(),

                'employeeVisitsToday' => (clone $todayVisits)
                    ->whereHas('visitor', function (Builder $query): void {
                        $query->where('type', RegisteredVisitor::TYPE_EMPLOYEE);
                    })
                    ->count(),
            ],
        ];
    }
}

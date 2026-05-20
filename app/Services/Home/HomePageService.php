<?php

namespace App\Services\Home;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
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
            ->forRequiredSchoolYear($schoolYear?->id);

        return [
            'schoolYear' => $schoolYear?->only(['id', 'name']),
            'scanSettings' => $this->scanSettings->toPageProps(),

            'metrics' => [
                'students' => LibraryMember::query()
                    ->where('type', LibraryMember::TYPE_STUDENT)
                    ->visitEligibleForSchoolYear($schoolYear?->id)
                    ->count(),

                'employees' => LibraryMember::query()
                    ->where('type', LibraryMember::TYPE_EMPLOYEE)
                    ->visitEligibleForSchoolYear($schoolYear?->id)
                    ->count(),

                'visitsToday' => (clone $todayVisits)->count(),

                'studentVisitsToday' => (clone $todayVisits)
                    ->whereHas('visitor', function (Builder $query): void {
                        $query->where('type', LibraryMember::TYPE_STUDENT);
                    })
                    ->count(),

                'employeeVisitsToday' => (clone $todayVisits)
                    ->whereHas('visitor', function (Builder $query): void {
                        $query->where('type', LibraryMember::TYPE_EMPLOYEE);
                    })
                    ->count(),
            ],
        ];
    }
}

<?php

namespace App\Services\Home;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class HomePageService
{
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

            'metrics' => [
                'students' => LibraryMember::active()
                    ->where('type', LibraryMember::TYPE_STUDENT)
                    ->visitEligibleForSchoolYear($schoolYear?->id)
                    ->count(),

                'employees' => LibraryMember::active()
                    ->where('type', LibraryMember::TYPE_EMPLOYEE)
                    ->count(),

                'visitsToday' => (clone $todayVisits)->count(),

                'studentVisitsToday' => (clone $todayVisits)
                    ->whereHas('member', function (Builder $query): void {
                        $query->where('type', LibraryMember::TYPE_STUDENT);
                    })
                    ->count(),

                'employeeVisitsToday' => (clone $todayVisits)
                    ->whereHas('member', function (Builder $query): void {
                        $query->where('type', LibraryMember::TYPE_EMPLOYEE);
                    })
                    ->count(),
            ],
        ];
    }
}

<?php

namespace App\Services\Dashboard;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class PublicDashboardService
{
    public function getData(): array
    {
        $schoolYear = SchoolYear::active()->first();
        $today = Carbon::today();
        $todayVisitQuery = LibraryVisit::whereDate('visited_at', $today);

        return [
            'schoolYear' => $schoolYear?->only(['id', 'name']),
            'metrics' => [
                'students' => LibraryMember::active()->where('type', LibraryMember::TYPE_STUDENT)->count(),
                'employees' => LibraryMember::active()->where('type', LibraryMember::TYPE_EMPLOYEE)->count(),
                'visitsToday' => (clone $todayVisitQuery)->count(),
                'studentVisitsToday' => (clone $todayVisitQuery)
                    ->whereHas('member', fn (Builder $query) => $query->where('type', LibraryMember::TYPE_STUDENT))
                    ->count(),
                'employeeVisitsToday' => (clone $todayVisitQuery)
                    ->whereHas('member', fn (Builder $query) => $query->where('type', LibraryMember::TYPE_EMPLOYEE))
                    ->count(),
                'visitsThisSchoolYear' => $schoolYear
                    ? LibraryVisit::where('school_year_id', $schoolYear->id)->count()
                    : 0,
            ],
        ];
    }
}

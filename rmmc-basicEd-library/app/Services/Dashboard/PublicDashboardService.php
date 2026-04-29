<?php

namespace App\Services\Dashboard;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use Illuminate\Support\Carbon;

class PublicDashboardService
{
    public function getData(bool $detailed = false): array
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
                    ->whereHas('member', fn ($query) => $query->where('type', LibraryMember::TYPE_STUDENT))
                    ->count(),
                'employeeVisitsToday' => (clone $todayVisitQuery)
                    ->whereHas('member', fn ($query) => $query->where('type', LibraryMember::TYPE_EMPLOYEE))
                    ->count(),
                'visitsThisSchoolYear' => $schoolYear
                    ? LibraryVisit::where('school_year_id', $schoolYear->id)->count()
                    : 0,
            ],
            'todayVisits' => LibraryVisit::query()
                ->with([
                    'member:id,school_id,type,first_name,middle_name,last_name,photo',
                    'member.student:id,library_member_id,year_level,section',
                    'member.employee:id,library_member_id,department',
                ])
                ->whereDate('visited_at', $today)
                ->latest('visited_at')
                ->limit($detailed ? 30 : 12)
                ->get()
                ->map(fn (LibraryVisit $visit): array => [
                    'id' => $visit->id,
                    'visitedAt' => $visit->visited_at?->toIso8601String(),
                    'member' => [
                        'schoolId' => $visit->member?->school_id,
                        'name' => $visit->member?->full_name,
                        'type' => $visit->member?->type,
                        'group' => $visit->member?->group,
                        'yearLevel' => $visit->member?->student?->year_level,
                        'section' => $visit->member?->student?->section,
                        'department' => $visit->member?->employee?->department,
                        'photo' => $visit->member?->photo,
                    ],
                ]),
        ];
    }
}

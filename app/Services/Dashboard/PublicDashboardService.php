<?php

namespace App\Services\Dashboard;

use App\Models\LibraryVisit;
use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class PublicDashboardService
{
    public function getData(): array
    {
        $schoolYear = SchoolYear::active()->first();
        $today = Carbon::today();
        $todayVisitQuery = LibraryVisit::query()
            ->whereDate('visited_at', $today)
            ->when($schoolYear, fn (Builder $query) => $query->where('school_year_id', $schoolYear->id), fn (Builder $query) => $query->whereRaw('1 = 0'));

        return [
            'schoolYear' => $schoolYear?->only(['id', 'name']),
            'metrics' => [
                'students' => RegisteredVisitor::active()
                    ->where('type', RegisteredVisitor::TYPE_STUDENT)
                    ->visitEligibleForSchoolYear($schoolYear?->id)
                    ->count(),
                'employees' => RegisteredVisitor::active()->where('type', RegisteredVisitor::TYPE_EMPLOYEE)->count(),
                'visitsToday' => (clone $todayVisitQuery)->count(),
                'studentVisitsToday' => (clone $todayVisitQuery)
                    ->whereHas('visitor', fn (Builder $query) => $query->where('type', RegisteredVisitor::TYPE_STUDENT))
                    ->count(),
                'employeeVisitsToday' => (clone $todayVisitQuery)
                    ->whereHas('visitor', fn (Builder $query) => $query->where('type', RegisteredVisitor::TYPE_EMPLOYEE))
                    ->count(),
            ],
        ];
    }
}

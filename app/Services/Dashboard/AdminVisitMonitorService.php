<?php

namespace App\Services\Dashboard;

use App\Models\RegisteredVisitor;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class AdminVisitMonitorService
{
    public function getData(): array
    {
        $today = Carbon::today();
        $activeSchoolYearId = SchoolYear::active()->value('id');
        $todayVisitQuery = LibraryVisit::query()
            ->whereDate('visited_at', $today)
            ->when($activeSchoolYearId, fn (Builder $query) => $query->where('school_year_id', $activeSchoolYearId), fn (Builder $query) => $query->whereRaw('1 = 0'));

        return [
            'metrics' => [
                'visitsToday' => (clone $todayVisitQuery)->count(),
                'studentVisitsToday' => (clone $todayVisitQuery)
                    ->whereHas('visitor', fn (Builder $query) => $query->where('type', RegisteredVisitor::TYPE_STUDENT))
                    ->count(),
                'employeeVisitsToday' => (clone $todayVisitQuery)
                    ->whereHas('visitor', fn (Builder $query) => $query->where('type', RegisteredVisitor::TYPE_EMPLOYEE))
                    ->count(),
            ],
            'todayVisits' => LibraryVisit::query()
                ->with([
                    'visitor:id,school_id,type,first_name,middle_name,last_name,photo',
                    'visitor.student' => fn ($query) => $query
                        ->select(
                            'student_registrations.id',
                            'student_registrations.registered_visitor_id',
                            'student_registrations.school_year_id',
                            'student_registrations.year_level',
                            'student_registrations.section',
                        )
                        ->forSchoolYear($activeSchoolYearId),
                    'visitor.employee' => fn ($query) => $query
                        ->select('id', 'registered_visitor_id', 'school_year_id', 'department')
                        ->forSchoolYear($activeSchoolYearId),
                ])
                ->whereDate('visited_at', $today)
                ->when($activeSchoolYearId, fn (Builder $query) => $query->where('school_year_id', $activeSchoolYearId), fn (Builder $query) => $query->whereRaw('1 = 0'))
                ->latest('visited_at')
                ->get()
                ->map(fn (LibraryVisit $visit): array => $this->visitData($visit)),
            'scanTargets' => [],
        ];
    }

    public function searchScanTargets(string $search, int $limit = 8): array
    {
        $search = trim($search);

        if ($search === '') {
            return [];
        }

        $activeSchoolYearId = SchoolYear::active()->value('id');

        return RegisteredVisitor::query()
            ->visitEligibleForSchoolYear($activeSchoolYearId)
            ->with([
                'student' => fn ($query) => $query
                    ->select(
                        'student_registrations.id',
                        'student_registrations.registered_visitor_id',
                        'student_registrations.school_year_id',
                        'student_registrations.year_level',
                        'student_registrations.section',
                    )
                    ->forSchoolYear($activeSchoolYearId),
                'employee' => fn ($query) => $query
                    ->select('id', 'registered_visitor_id', 'school_year_id', 'department')
                    ->forSchoolYear($activeSchoolYearId),
            ])
            ->where(function (Builder $query) use ($activeSchoolYearId, $search): void {
                $query
                    ->where('school_id', 'like', "{$search}%")
                    ->orWhere('rfid_uid', 'like', "{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereHas('studentRegistrations', function (Builder $query) use ($activeSchoolYearId, $search): void {
                        $query
                            ->forSchoolYear($activeSchoolYearId)
                            ->where(function (Builder $query) use ($search): void {
                                $query
                                    ->where('year_level', 'like', "%{$search}%")
                                    ->orWhere('section', 'like', "%{$search}%");
                            });
                    })
                    ->orWhereHas('employeeProfiles', fn (Builder $query) => $query
                        ->forSchoolYear($activeSchoolYearId)
                        ->where('department', 'like', "%{$search}%"));
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit($limit)
            ->get()
            ->map(fn (RegisteredVisitor $visitor): array => $this->scanTargetData($visitor))
            ->all();
    }

    private function visitData(LibraryVisit $visit): array
    {
        return [
            'id' => $visit->id,
            'visitedAt' => $visit->visited_at?->toIso8601String(),
            'visitor' => [
                'schoolId' => $visit->visitor?->school_id,
                'name' => $visit->visitor?->full_name,
                'type' => $visit->visitor?->type,
                'yearLevel' => $visit->visitor?->student?->year_level,
                'section' => $visit->visitor?->student?->section,
                'department' => $visit->visitor?->employee?->department,
                'photoUrl' => $visit->visitor?->photo ? asset('visitor-photos/'.$visit->visitor->photo) : null,
            ],
        ];
    }

    private function scanTargetData(RegisteredVisitor $visitor): array
    {
        return [
            'id' => $visitor->id,
            'RFIDUid' => $visitor->rfid_uid,
            'schoolId' => $visitor->school_id,
            'name' => $visitor->full_name,
            'firstName' => $visitor->first_name,
            'lastName' => $visitor->last_name,
            'type' => $visitor->type,
            'detail' => $visitor->type === RegisteredVisitor::TYPE_EMPLOYEE
                ? $visitor->employee?->department
                : collect([$visitor->student?->year_level, $visitor->student?->section])->filter()->join(' - '),
        ];
    }
}

<?php

namespace App\Services\Dashboard;

use App\Models\LibraryMember;
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
                    ->whereHas('member', fn (Builder $query) => $query->where('type', LibraryMember::TYPE_STUDENT))
                    ->count(),
                'employeeVisitsToday' => (clone $todayVisitQuery)
                    ->whereHas('member', fn (Builder $query) => $query->where('type', LibraryMember::TYPE_EMPLOYEE))
                    ->count(),
            ],
            'todayVisits' => LibraryVisit::query()
                ->with([
                    'member:id,school_id,type,first_name,middle_name,last_name,photo',
                    'member.student' => fn ($query) => $query
                        ->select(
                            'student_enrollments.id',
                            'student_enrollments.library_member_id',
                            'student_enrollments.school_year_id',
                            'student_enrollments.year_level',
                            'student_enrollments.section',
                        )
                        ->forSchoolYear($activeSchoolYearId),
                    'member.employee:id,library_member_id,department',
                ])
                ->whereDate('visited_at', $today)
                ->when($activeSchoolYearId, fn (Builder $query) => $query->where('school_year_id', $activeSchoolYearId), fn (Builder $query) => $query->whereRaw('1 = 0'))
                ->latest('visited_at')
                ->get()
                ->map(fn (LibraryVisit $visit): array => $this->visitData($visit)),
            'scanTargets' => LibraryMember::active()
                ->visitEligibleForSchoolYear($activeSchoolYearId)
                ->with([
                    'student' => fn ($query) => $query
                        ->select(
                            'student_enrollments.id',
                            'student_enrollments.library_member_id',
                            'student_enrollments.school_year_id',
                            'student_enrollments.year_level',
                            'student_enrollments.section',
                        )
                        ->forSchoolYear($activeSchoolYearId),
                    'employee:id,library_member_id,department',
                ])
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get()
                ->map(fn (LibraryMember $member): array => $this->scanTargetData($member)),
        ];
    }

    private function visitData(LibraryVisit $visit): array
    {
        return [
            'id' => $visit->id,
            'visitedAt' => $visit->visited_at?->toIso8601String(),
            'member' => [
                'schoolId' => $visit->member?->school_id,
                'name' => $visit->member?->full_name,
                'type' => $visit->member?->type,
                'yearLevel' => $visit->member?->student?->year_level,
                'section' => $visit->member?->student?->section,
                'department' => $visit->member?->employee?->department,
                'photoUrl' => $visit->member?->photo ? asset('member-photos/'.$visit->member->photo) : null,
            ],
        ];
    }

    private function scanTargetData(LibraryMember $member): array
    {
        return [
            'id' => $member->id,
            'RFIDUid' => $member->rfid_uid,
            'schoolId' => $member->school_id,
            'name' => $member->full_name,
            'firstName' => $member->first_name,
            'lastName' => $member->last_name,
            'type' => $member->type,
            'detail' => $member->type === LibraryMember::TYPE_EMPLOYEE
                ? $member->employee?->department
                : collect([$member->student?->year_level, $member->student?->section])->filter()->join(' - '),
        ];
    }
}

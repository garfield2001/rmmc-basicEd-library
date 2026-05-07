<?php

namespace App\Services\Reports;

use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\StudentEnrollment;
use Illuminate\Support\Carbon;

class VisitReportService
{
    public function getData(array $filters = []): array
    {
        $startDate = isset($filters['start_date']) ? Carbon::parse($filters['start_date'])->startOfDay() : now()->startOfMonth();
        $endDate = isset($filters['end_date']) ? Carbon::parse($filters['end_date'])->endOfDay() : now()->endOfDay();
        $schoolYearId = $filters['school_year_id'] ?? SchoolYear::active()->value('id');
        $memberType = $filters['member_type'] ?? null;
        $memberStatus = $filters['member_status'] ?? null;
        $yearLevel = $filters['year_level'] ?? null;
        $section = $filters['section'] ?? null;
        $department = $filters['department'] ?? null;

        $query = LibraryVisit::query()
            ->with(['member.studentEnrollments', 'member.employee', 'schoolYear'])
            ->whereBetween('visited_at', [$startDate, $endDate])
            ->when($schoolYearId, fn ($query) => $query->where('school_year_id', $schoolYearId))
            ->when($memberType, fn ($query) => $query->whereHas('member', fn ($memberQuery) => $memberQuery->where('type', $memberType)))
            ->when($memberStatus, fn ($query) => $query->whereHas('member', fn ($memberQuery) => $memberQuery->where('is_active', $memberStatus === 'active')))
            ->when($department, fn ($query) => $query->whereHas('member.employee', fn ($employeeQuery) => $employeeQuery->where('department', $department)))
            ->latest('visited_at');

        $visits = $query->get()
            ->filter(function (LibraryVisit $visit) use ($yearLevel, $section): bool {
                $enrollment = $this->studentEnrollmentForVisit($visit);

                if ($yearLevel && $enrollment?->year_level !== $yearLevel) {
                    return false;
                }

                if ($section && $enrollment?->section !== $section) {
                    return false;
                }

                return true;
            })
            ->values();

        return [
            'filters' => [
                'school_year_id' => $schoolYearId ? (int) $schoolYearId : null,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'member_type' => $memberType,
                'member_status' => $memberStatus,
                'year_level' => $yearLevel,
                'section' => $section,
                'department' => $department,
            ],
            'summary' => [
                'total' => $visits->count(),
                'students' => $visits->where('member.type', 'student')->count(),
                'employees' => $visits->where('member.type', 'employee')->count(),
            ],
            'rows' => $visits->map(fn (LibraryVisit $visit): array => [
                'id' => $visit->id,
                'visited_at' => $visit->visited_at?->format('Y-m-d H:i:s'),
                'school_year' => $visit->schoolYear?->name,
                'school_id' => $visit->member?->school_id,
                'name' => $visit->member?->full_name,
                'type' => $visit->member?->type,
                'department' => $visit->member?->employee?->department,
                'year_level' => $this->studentEnrollmentForVisit($visit)?->year_level,
                'section' => $this->studentEnrollmentForVisit($visit)?->section,
            ])->values(),
        ];
    }

    private function studentEnrollmentForVisit(LibraryVisit $visit): ?StudentEnrollment
    {
        return $visit->member?->studentEnrollments
            ?->firstWhere('school_year_id', $visit->school_year_id);
    }
}

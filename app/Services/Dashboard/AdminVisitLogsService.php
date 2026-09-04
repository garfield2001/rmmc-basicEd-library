<?php

namespace App\Services\Dashboard;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Support\Academics\AcademicLevels;

class AdminVisitLogsService
{
    public function __construct(private readonly AdminVisitPayloadService $payloads) {}

    public function getData(): array
    {
        $schoolYear = SchoolYear::active()->first();
        $schoolYearId = $schoolYear?->id;
        $visitors = LibraryMember::query()
            ->visitEligibleForSchoolYear($schoolYearId)
            ->with([
                'student' => AdminVisitRelations::student($schoolYearId),
                'employee' => AdminVisitRelations::employee($schoolYearId),
                'visits' => fn ($query) => $query
                    ->select('id', 'library_member_id', 'school_year_id', 'visited_at')
                    ->forRequiredSchoolYear($schoolYearId)
                    ->latest('visited_at'),
            ])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(fn (LibraryMember $visitor): array => $this->payloads->visitorHistoryData($visitor));

        $students = $visitors->where('type', LibraryMember::TYPE_STUDENT);
        $employees = $visitors->where('type', LibraryMember::TYPE_EMPLOYEE);

        return [
            'schoolYear' => $schoolYear ? $this->schoolYearData($schoolYear) : null,
            'metrics' => $this->metrics($visitors, $students, $employees),
            'filters' => $this->filters($students, $employees),
            'visitors' => $visitors,
        ];
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

    private function metrics(mixed $visitors, mixed $students, mixed $employees): array
    {
        return [
            'visitors' => $visitors->count(),
            'studentVisitors' => $students->count(),
            'employeeVisitors' => $employees->count(),
            'visits' => $visitors->sum(fn (array $visitor): int => count($visitor['visits'])),
            'studentVisits' => $students->sum(fn (array $visitor): int => count($visitor['visits'])),
            'employeeVisits' => $employees->sum(fn (array $visitor): int => count($visitor['visits'])),
        ];
    }

    private function filters(mixed $students, mixed $employees): array
    {
        $yearLevels = $students->pluck('yearLevel')->filter()->unique()->values();

        return [
            'yearLevels' => collect(AcademicLevels::options())
                ->filter(fn (string $yearLevel): bool => $yearLevels->contains($yearLevel))
                ->values()
                ->all(),
            'sectionsByYearLevel' => $students
                ->groupBy('yearLevel')
                ->map(fn ($group) => $this->sortedUnique($group->pluck('section')))
                ->all(),
            'departments' => $this->sortedUnique($employees->pluck('department')),
        ];
    }

    private function sortedUnique(mixed $values): array
    {
        return $values
            ->filter()
            ->unique()
            ->sort(fn (string $first, string $second): int => strnatcasecmp($first, $second))
            ->values()
            ->all();
    }
}

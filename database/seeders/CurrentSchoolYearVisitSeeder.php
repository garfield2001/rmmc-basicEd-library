<?php

namespace Database\Seeders;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class CurrentSchoolYearVisitSeeder extends Seeder
{
    private const FIRST_VISIT_DATE = '2026-01-08';

    private const LAST_VISIT_DATE = '2026-05-25';

    private array $studentGroupPositions = [];

    private array $employeeDepartmentPositions = [];

    public function run(): void
    {
        $schoolYear = SchoolYear::query()->where('name', '2026-2027')->firstOrFail();

        $this->seedStudentVisits($schoolYear);
        $this->seedEmployeeVisits($schoolYear);
    }

    private function seedStudentVisits(SchoolYear $schoolYear): void
    {
        LibraryMember::query()
            ->where('type', LibraryMember::TYPE_STUDENT)
            ->whereHas('studentSchoolYearRecords', fn ($query) => $query->forSchoolYear($schoolYear->id))
            ->with('student')
            ->orderBy('school_id')
            ->get()
            ->each(function (LibraryMember $visitor, int $index) use ($schoolYear): void {
                $baseVisits = $this->studentVisitCount($visitor, $index);

                for ($visitNumber = 0; $visitNumber < $baseVisits; $visitNumber++) {
                    $dayOffset = $this->studentDayOffset($index, $visitNumber, $baseVisits);
                    $minuteOffset = (($index * 11) + ($visitNumber * 17)) % 420;

                    $this->visit(
                        $visitor,
                        $schoolYear,
                        $this->visitDate('07:40:00', $dayOffset, $minuteOffset),
                    );
                }
            });
    }

    private function seedEmployeeVisits(SchoolYear $schoolYear): void
    {
        LibraryMember::query()
            ->where('type', LibraryMember::TYPE_EMPLOYEE)
            ->whereHas('employeeSchoolYearRecords', fn ($query) => $query->forSchoolYear($schoolYear->id))
            ->with('employee')
            ->orderBy('school_id')
            ->get()
            ->each(function (LibraryMember $visitor, int $index) use ($schoolYear): void {
                $baseVisits = $this->employeeVisitCount($visitor, $index);

                for ($visitNumber = 0; $visitNumber < $baseVisits; $visitNumber++) {
                    $dayOffset = $this->employeeDayOffset($index, $visitNumber, $baseVisits);
                    $minuteOffset = (($index * 13) + ($visitNumber * 29)) % 360;

                    $this->visit(
                        $visitor,
                        $schoolYear,
                        $this->visitDate('08:05:00', $dayOffset, $minuteOffset),
                    );
                }
            });
    }

    private function studentVisitCount(LibraryMember $visitor, int $index): int
    {
        $group = collect([$visitor->student?->year_level, $visitor->student?->section])->filter()->implode(' - ') ?: 'Unassigned';
        $position = $this->nextStudentGroupPosition($group);

        if (in_array($group, $this->lowStudentGroups(), true) && $position <= 6) {
            return [0, 0, 1, 2, 3, 4][$position - 1];
        }

        return match (true) {
            $index % 41 === 0 => 0,
            $index % 23 === 0 => 2,
            $index % 13 === 0 => 5,
            $index % 7 === 0 => 7 + ($index % 2),
            $index % 5 === 0 => 10 + ($index % 4),
            default => 8 + ($index % 6),
        };
    }

    private function employeeVisitCount(LibraryMember $visitor, int $index): int
    {
        $department = $visitor->employee?->department ?: 'Unassigned';
        $position = $this->nextEmployeeDepartmentPosition($department);

        if (in_array($department, $this->lowEmployeeDepartments(), true) && $position <= 5) {
            return [0, 1, 2, 3, 4][$position - 1];
        }

        return match (true) {
            $index % 31 === 0 => 0,
            $index % 17 === 0 => 3,
            $index % 11 === 0 => 6,
            $index % 4 === 0 => 15 + ($index % 4),
            default => 11 + ($index % 6),
        };
    }

    private function studentDayOffset(int $index, int $visitNumber, int $baseVisits): int
    {
        if ($visitNumber === 0 && $index === 1) {
            return 0;
        }

        if ($baseVisits > 0 && $visitNumber === $baseVisits - 1 && $index % 9 === 1) {
            return $this->visitDays() - 1;
        }

        return (($index - 1) + ($visitNumber * 11)) % $this->visitDays();
    }

    private function employeeDayOffset(int $index, int $visitNumber, int $baseVisits): int
    {
        if ($visitNumber === 0 && $index === 1) {
            return 0;
        }

        if ($baseVisits > 0 && $visitNumber === $baseVisits - 1 && $index % 8 === 1) {
            return $this->visitDays() - 1;
        }

        return ((($index - 1) * 2) + ($visitNumber * 13)) % $this->visitDays();
    }

    private function nextStudentGroupPosition(string $group): int
    {
        $this->studentGroupPositions[$group] = ($this->studentGroupPositions[$group] ?? 0) + 1;

        return $this->studentGroupPositions[$group];
    }

    private function nextEmployeeDepartmentPosition(string $department): int
    {
        $this->employeeDepartmentPositions[$department] = ($this->employeeDepartmentPositions[$department] ?? 0) + 1;

        return $this->employeeDepartmentPositions[$department];
    }

    private function lowStudentGroups(): array
    {
        return [
            'Grade 1 - Camia',
            'Grade 5 - Harmony',
            'Grade 8 - Prudence',
            'Grade 10 - Zeal',
        ];
    }

    private function lowEmployeeDepartments(): array
    {
        return [
            'Management Information Systems',
            'College of Hospitality Management Faculty',
            'Science Faculty',
        ];
    }

    private function visitDate(string $time, int $dayOffset, int $minuteOffset): Carbon
    {
        return Carbon::parse(self::FIRST_VISIT_DATE.' '.$time)->addDays($dayOffset)->addMinutes($minuteOffset);
    }

    private function visitDays(): int
    {
        return (int) Carbon::parse(self::FIRST_VISIT_DATE)->diffInDays(Carbon::parse(self::LAST_VISIT_DATE)) + 1;
    }

    private function visit(LibraryMember $visitor, SchoolYear $schoolYear, Carbon $visitedAt): void
    {
        LibraryVisit::query()->firstOrCreate([
            'library_member_id' => $visitor->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => $visitedAt,
        ]);
    }
}

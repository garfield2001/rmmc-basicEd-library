<?php

namespace Database\Seeders;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Support\Academics\AcademicLevels;
use Database\Seeders\Data\HistoricalSchoolYearData;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class HistoricalSchoolYearSeeder extends Seeder
{
    public function run(): void
    {
        $schoolYear = SchoolYear::query()->where('name', '2025-2026')->firstOrFail();

        $this->seedPreviousStudentRecords($schoolYear);
        $this->seedCompletedGradeTenStudents($schoolYear);
        $this->seedPreviousEmployeeSchoolYearRecords($schoolYear);
        $this->seedHistoricalVisits($schoolYear);
    }

    private function seedPreviousStudentRecords(SchoolYear $schoolYear): void
    {
        LibraryMember::query()
            ->where('type', LibraryMember::TYPE_STUDENT)
            ->with('student')
            ->get()
            ->each(function (LibraryMember $visitor) use ($schoolYear): void {
                $currentStudentRecord = $visitor->student;

                if (! $currentStudentRecord) {
                    return;
                }

                $yearLevel = $this->previousLevel($currentStudentRecord->year_level);
                $section = $currentStudentRecord->section ?: 'A';
                $schoolYearSection = $this->section($schoolYear, $yearLevel, $section);

                $visitor->studentSchoolYearRecords()->updateOrCreate(
                    ['school_year_id' => $schoolYear->id],
                    [
                        'school_year_section_id' => $schoolYearSection->id,
                        ...$this->visitorSnapshot($visitor),
                        'year_level' => $yearLevel,
                        'section' => $section,
                    ],
                );
            });
    }

    private function seedCompletedGradeTenStudents(SchoolYear $schoolYear): void
    {
        $section = $this->section($schoolYear, 'Grade 10', 'Rizal');

        foreach (HistoricalSchoolYearData::completedGradeTenStudents() as $student) {
            $visitor = LibraryMember::query()->firstOrCreate(
                ['school_id' => $student['school_id']],
                [
                    'rfid_uid' => $student['rfid_uid'],
                    'type' => LibraryMember::TYPE_STUDENT,
                    'first_name' => $student['first_name'],
                    'middle_name' => null,
                    'last_name' => $student['last_name'],
                    'photo' => null,
                ],
            );

            $visitor->studentSchoolYearRecords()->updateOrCreate(
                ['school_year_id' => $schoolYear->id],
                [
                    'school_year_section_id' => $section->id,
                    ...$this->visitorSnapshot($visitor),
                    'year_level' => 'Grade 10',
                    'section' => 'Rizal',
                ],
            );
        }
    }

    private function seedPreviousEmployeeSchoolYearRecords(SchoolYear $schoolYear): void
    {
        LibraryMember::query()
            ->where('type', LibraryMember::TYPE_EMPLOYEE)
            ->with('employee')
            ->get()
            ->each(function (LibraryMember $visitor) use ($schoolYear): void {
                $visitor->employeeSchoolYearRecords()->updateOrCreate(
                    ['school_year_id' => $schoolYear->id],
                    $this->visitorSnapshot($visitor) + [
                        'department' => $visitor->employee?->department ?? 'Unassigned',
                    ],
                );
            });
    }

    private function seedHistoricalVisits(SchoolYear $schoolYear): void
    {
        $students = LibraryMember::query()
            ->where('type', LibraryMember::TYPE_STUDENT)
            ->whereHas('studentSchoolYearRecords', fn ($query) => $query->forSchoolYear($schoolYear->id))
            ->orderBy('school_id')
            ->get();

        $employees = LibraryMember::query()
            ->where('type', LibraryMember::TYPE_EMPLOYEE)
            ->whereHas('employeeSchoolYearRecords', fn ($query) => $query->forSchoolYear($schoolYear->id))
            ->orderBy('school_id')
            ->get();

        $students->each(function (LibraryMember $visitor, int $index) use ($schoolYear): void {
            $visitCount = $this->historicalStudentVisitCount($index);

            for ($visitNumber = 0; $visitNumber < $visitCount; $visitNumber++) {
                $this->visit(
                    $visitor,
                    $schoolYear,
                    Carbon::parse('2025-06-09 08:15:00')
                        ->addDays((($index * 3) + ($visitNumber * 19)) % 206)
                        ->addMinutes((($index * 7) + ($visitNumber * 13)) % 360),
                );
            }
        });

        $employees->each(function (LibraryMember $visitor, int $index) use ($schoolYear): void {
            $visitCount = $this->historicalEmployeeVisitCount($index);

            for ($visitNumber = 0; $visitNumber < $visitCount; $visitNumber++) {
                $this->visit(
                    $visitor,
                    $schoolYear,
                    Carbon::parse('2025-06-16 09:00:00')
                        ->addDays((($index * 5) + ($visitNumber * 23)) % 199)
                        ->addMinutes((($index * 11) + ($visitNumber * 17)) % 300),
                );
            }
        });
    }

    private function historicalStudentVisitCount(int $index): int
    {
        return match (true) {
            $index % 37 === 0 => 0,
            $index % 19 === 0 => 1,
            $index % 11 === 0 => 2,
            $index % 5 === 0 => 4 + ($index % 3),
            default => 3 + ($index % 3),
        };
    }

    private function historicalEmployeeVisitCount(int $index): int
    {
        return match (true) {
            $index % 23 === 0 => 0,
            $index % 13 === 0 => 1,
            $index % 7 === 0 => 3,
            default => 4 + ($index % 3),
        };
    }

    private function visit(LibraryMember $visitor, SchoolYear $schoolYear, Carbon $visitedAt): void
    {
        LibraryVisit::query()->firstOrCreate([
            'library_member_id' => $visitor->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => $visitedAt,
        ]);
    }

    private function visitorSnapshot(LibraryMember $visitor): array
    {
        return [
            'school_id' => $visitor->school_id,
            'rfid_uid' => $visitor->rfid_uid,
            'first_name' => $visitor->first_name,
            'middle_name' => $visitor->middle_name,
            'last_name' => $visitor->last_name,
            'photo' => $visitor->photo,
        ];
    }

    private function section(SchoolYear $schoolYear, string $yearLevel, string $name): SchoolYearSection
    {
        return SchoolYearSection::query()->firstOrCreate([
            'school_year_id' => $schoolYear->id,
            'year_level' => $yearLevel,
            'name' => $name,
        ]);
    }

    private function previousLevel(?string $yearLevel): string
    {
        $rank = AcademicLevels::rank($yearLevel);

        if ($rank === null || $rank === 0) {
            return $yearLevel ?: 'Kindergarten 1';
        }

        return AcademicLevels::options()[$rank - 1];
    }
}

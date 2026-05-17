<?php

namespace Database\Seeders;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Support\Academics\AcademicLevels;
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

        foreach ($this->completedStudents() as $student) {
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
            ->limit(55)
            ->get();

        $employee_school_year_records = LibraryMember::query()
            ->where('type', LibraryMember::TYPE_EMPLOYEE)
            ->orderBy('school_id')
            ->limit(18)
            ->get();

        $students->each(function (LibraryMember $visitor, int $index) use ($schoolYear): void {
            $this->visit($visitor, $schoolYear, Carbon::parse('2025-07-07 08:15:00')->addDays($index % 24));

            if ($index % 3 !== 0) {
                $this->visit($visitor, $schoolYear, Carbon::parse('2025-09-08 09:30:00')->addDays($index % 30));
            }
        });

        $employee_school_year_records->each(function (LibraryMember $visitor, int $index) use ($schoolYear): void {
            $this->visit($visitor, $schoolYear, Carbon::parse('2025-08-04 10:00:00')->addDays($index % 20));
        });
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

    /**
     * @return array<int, array<string, string>>
     */
    private function completedStudents(): array
    {
        return [
            ['school_id' => '2510109001', 'rfid_uid' => '9000009001', 'first_name' => 'Andrea', 'last_name' => 'Valdez'],
            ['school_id' => '2510109002', 'rfid_uid' => '9000009002', 'first_name' => 'Miguel', 'last_name' => 'Soriano'],
            ['school_id' => '2510109003', 'rfid_uid' => '9000009003', 'first_name' => 'Bianca', 'last_name' => 'Navarro'],
            ['school_id' => '2510109004', 'rfid_uid' => '9000009004', 'first_name' => 'Paolo', 'last_name' => 'Mercado'],
            ['school_id' => '2510109005', 'rfid_uid' => '9000009005', 'first_name' => 'Clarisse', 'last_name' => 'Domingo'],
            ['school_id' => '2510109006', 'rfid_uid' => '9000009006', 'first_name' => 'Jerome', 'last_name' => 'Bautista'],
            ['school_id' => '2510109007', 'rfid_uid' => '9000009007', 'first_name' => 'Therese', 'last_name' => 'Castillo'],
            ['school_id' => '2510109008', 'rfid_uid' => '9000009008', 'first_name' => 'Kyle', 'last_name' => 'Fernandez'],
            ['school_id' => '2510109009', 'rfid_uid' => '9000009009', 'first_name' => 'Mariel', 'last_name' => 'Villanueva'],
            ['school_id' => '2510109010', 'rfid_uid' => '9000009010', 'first_name' => 'Cedric', 'last_name' => 'Lim'],
        ];
    }
}

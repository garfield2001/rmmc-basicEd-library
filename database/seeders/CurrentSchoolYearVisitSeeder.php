<?php

namespace Database\Seeders;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class CurrentSchoolYearVisitSeeder extends Seeder
{
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
            ->limit(180)
            ->get()
            ->each(function (LibraryMember $visitor, int $index) use ($schoolYear): void {
                $baseVisits = 1 + ($index % 4);

                for ($visitNumber = 0; $visitNumber < $baseVisits; $visitNumber++) {
                    $dayOffset = ($index + ($visitNumber * 3)) % 14;
                    $minuteOffset = (($index * 11) + ($visitNumber * 17)) % 420;

                    $this->visit(
                        $visitor,
                        $schoolYear,
                        Carbon::parse('2026-05-01 07:40:00')->addDays($dayOffset)->addMinutes($minuteOffset),
                    );
                }

                if (in_array($visitor->student?->year_level, ['Grade 8', 'Grade 9', 'Grade 10'], true) && $index % 3 === 0) {
                    $this->visit(
                        $visitor,
                        $schoolYear,
                        Carbon::parse('2026-05-08 13:10:00')->addDays($index % 7)->addMinutes(($index * 9) % 150),
                    );
                }
            });
    }

    private function seedEmployeeVisits(SchoolYear $schoolYear): void
    {
        LibraryMember::query()
            ->where('type', LibraryMember::TYPE_EMPLOYEE)
            ->whereHas('employeeSchoolYearRecords', fn ($query) => $query->forSchoolYear($schoolYear->id))
            ->orderBy('school_id')
            ->limit(55)
            ->get()
            ->each(function (LibraryMember $visitor, int $index) use ($schoolYear): void {
                $baseVisits = 1 + ($index % 3);

                for ($visitNumber = 0; $visitNumber < $baseVisits; $visitNumber++) {
                    $dayOffset = (($index * 2) + ($visitNumber * 4)) % 14;
                    $minuteOffset = (($index * 13) + ($visitNumber * 29)) % 360;

                    $this->visit(
                        $visitor,
                        $schoolYear,
                        Carbon::parse('2026-05-01 08:05:00')->addDays($dayOffset)->addMinutes($minuteOffset),
                    );
                }
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
}

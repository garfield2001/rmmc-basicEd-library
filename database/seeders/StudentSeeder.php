<?php

namespace Database\Seeders;

use App\Support\Academics\AcademicLevels;
use Database\Seeders\Data\StudentSeederData;

class StudentSeeder extends LibraryMemberSeeder
{
    public function run(): void
    {
        $this->createStudentVisitors($this->schoolStudents());
        $this->createStudentVisitors($this->generatedStudents());
    }

    /**
     * Add real school student details here.
     * Shared visitor data, including RFID, lives in LibraryMemberSeeder.
     * Factory students are added separately after this list.
     *
     * @return array<int, array<string, mixed>>
     */
    private function schoolStudents(): array
    {
        return $this->attachManualDetails($this->manualStudentVisitors(), StudentSeederData::manualDetails());
    }

    /**
     * This plan keeps the fake population close to the client description:
     * - Kinder to Grade 4 have one section each.
     * - Grades 5 to 10 have two or three sections each.
     * - Every fake section stays near 30 students and does not exceed 35.
     *
     * @return array<string, array<string, int>>
     */
    private function rosterPlan(): array
    {
        return StudentSeederData::rosterPlan();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function generatedStudents(): array
    {
        $students = [];

        foreach ($this->rosterPlan() as $yearLevel => $sections) {
            $yearIndex = AcademicLevels::rank($yearLevel);
            $sectionNumber = 1;

            foreach ($sections as $section => $studentCount) {
                foreach (range(1, $studentCount) as $studentIndex) {
                    $students[] = [
                        'school_id' => $this->fakeStudentSchoolId($yearIndex, $sectionNumber, $studentIndex),
                        'first_name' => fake()->firstName(),
                        'middle_name' => fake()->optional(0.25)->lastName(),
                        'last_name' => fake()->lastName(),
                        'year_level' => $yearLevel,
                        'section' => $section,
                    ];
                }

                $sectionNumber++;
            }
        }

        return $students;
    }

    private function fakeStudentSchoolId(int $yearIndex, int $sectionNumber, int $studentIndex): string
    {
        return sprintf('26%02d%02d%04d', $yearIndex, $sectionNumber, $studentIndex);
    }
}

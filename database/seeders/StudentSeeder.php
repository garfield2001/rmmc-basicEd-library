<?php

namespace Database\Seeders;

use App\Support\Academics\AcademicLevels;

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
        return $this->attachManualDetails($this->manualStudentVisitors(), [
            '1900001001' => [
                'year_level' => 'Kindergarten 1',
                'section' => 'Aguinaldo',
            ],
            '2000001002' => [
                'year_level' => 'Grade 1',
                'section' => 'Bonifacio',
            ],
            '2100001003' => [
                'year_level' => 'Grade 4',
                'section' => 'Del Pilar',
            ],
            '2200001004' => [
                'year_level' => 'Grade 6',
                'section' => 'Jacinto',
            ],
            '2300001005' => [
                'year_level' => 'Grade 7',
                'section' => 'Mabini',
            ],
            '2400001006' => [
                'year_level' => 'Grade 10',
                'section' => 'Rizal',
            ],
            '2500001007' => [
                'year_level' => 'Grade 10',
                'section' => 'Rizal',
            ],
            '2316020010' => [
                'year_level' => 'Grade 10',
                'section' => 'Mabini',
            ],
            '2211600042' => [
                'year_level' => 'Grade 9',
                'section' => 'Rizal',
            ],
            '2311600068' => [
                'year_level' => 'Grade 8',
                'section' => 'Bonifacio',
            ],
            '1811600033' => [
                'year_level' => 'Grade 10',
                'section' => 'Mabini',
            ],
        ]);
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
        return [
            'Kindergarten 1' => [
                'Aguinaldo' => 29,
            ],
            'Kindergarten 2' => [
                'Bonifacio' => 30,
            ],
            'Grade 1' => [
                'Bonifacio' => 29,
            ],
            'Grade 2' => [
                'Bonifacio' => 30,
            ],
            'Grade 3' => [
                'Mabini' => 28,
            ],
            'Grade 4' => [
                'Del Pilar' => 32,
            ],
            'Grade 5' => [
                'Aguinaldo' => 29,
                'Bonifacio' => 31,
            ],
            'Grade 6' => [
                'Jacinto' => 28,
                'Bonifacio' => 30,
                'Mabini' => 32,
            ],
            'Grade 7' => [
                'Bonifacio' => 30,
                'Mabini' => 32,
            ],
            'Grade 8' => [
                'Aguinaldo' => 29,
                'Bonifacio' => 31,
                'Mabini' => 33,
            ],
            'Grade 9' => [
                'Mabini' => 30,
                'Rizal' => 32,
            ],
            'Grade 10' => [
                'Aguinaldo' => 28,
                'Mabini' => 30,
                'Rizal' => 33,
            ],
        ];
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

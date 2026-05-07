<?php

namespace Database\Seeders;

use App\Support\Academics\AcademicLevels;

class StudentSeeder extends LibraryMemberSeeder
{
    private const STUDENTS_PER_SECTION = 30;

    private const SECTIONS_PER_YEAR_LEVEL = 3;

    public function run(): void
    {
        foreach ($this->schoolStudents() as $student) {
            $this->createStudentMember($student);
        }

        foreach ($this->generatedStudents() as $student) {
            $this->createStudentMember($student);
        }
    }

    /**
     * Add real school student details here.
     * Shared member data, including RFID, lives in LibraryMemberSeeder.
     * Factory students are added separately after this list.
     *
     * @return array<int, array<string, mixed>>
     */
    private function schoolStudents(): array
    {
        return $this->attachManualDetails($this->manualStudentMembers(), [
            '1900001001' => [
                'year_level' => 'Kindergarten',
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
     * @return array<int, array<string, mixed>>
     */
    private function generatedStudents(): array
    {
        $sections = ['Aguinaldo', 'Bonifacio', 'Mabini'];
        $students = [];

        foreach (AcademicLevels::options() as $yearIndex => $yearLevel) {
            foreach (array_slice($sections, 0, self::SECTIONS_PER_YEAR_LEVEL) as $sectionIndex => $section) {
                foreach (range(1, self::STUDENTS_PER_SECTION) as $studentIndex) {
                    $students[] = [
                        'school_id' => sprintf('26%02d%02d%04d', $yearIndex, $sectionIndex + 1, $studentIndex),
                        'first_name' => fake()->firstName(),
                        'middle_name' => fake()->optional(0.25)->lastName(),
                        'last_name' => fake()->lastName(),
                        'year_level' => $yearLevel,
                        'section' => $section,
                    ];
                }
            }
        }

        return $students;
    }
}

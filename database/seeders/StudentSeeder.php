<?php

namespace Database\Seeders;

use App\Models\Student;

class StudentSeeder extends LibraryMemberSeeder
{
    private const FAKE_STUDENT_COUNT = 15;

    public function run(): void
    {
        foreach ($this->schoolStudents() as $student) {
            $this->createStudentMember($student);
        }

        Student::factory()
            ->count(self::FAKE_STUDENT_COUNT)
            ->create();
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
                'year_level' => 'Kinder',
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
                'year_level' => 'Grade 12',
                'section' => 'STEM',
            ],
            '2316020010' => [
                'year_level' => 'Fourth Year',
                'section' => 'Block 1',
            ],
            '2211600042' => [
                'year_level' => 'Fourth Year',
                'section' => 'Block 3',
            ],
            '2311600068' => [
                'year_level' => 'Third Year',
                'section' => 'Block 2',
            ],
            '1811600033' => [
                'year_level' => 'Fourth Year',
                'section' => 'Block 1',
            ],
        ]);
    }
}

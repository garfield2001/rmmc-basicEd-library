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
     * Add real school student records here for testing known IDs.
     *
     * If rfid_uid is omitted, the seeder creates a random 10-digit RFID.
     * Factory students are added separately after this list.
     *
     * @return array<int, array<string, string|null>>
     */
    private function schoolStudents(): array
    {
        return [
            [
                'school_id' => 'STU-1001',
                'first_name' => 'Mikaela',
                'middle_name' => null,
                'last_name' => 'Cruz',
                'year_level' => 'Kinder',
                'section' => 'Aguinaldo',
            ],
            [
                'school_id' => 'STU-1002',
                'first_name' => 'Joaquin',
                'middle_name' => null,
                'last_name' => 'Santos',
                'year_level' => 'Grade 1',
                'section' => 'Bonifacio',
            ],
            [
                'school_id' => 'STU-1003',
                'first_name' => 'Althea',
                'middle_name' => null,
                'last_name' => 'Reyes',
                'year_level' => 'Grade 4',
                'section' => 'Del Pilar',
            ],
            [
                'school_id' => 'STU-1004',
                'first_name' => 'Nathaniel',
                'middle_name' => null,
                'last_name' => 'Garcia',
                'year_level' => 'Grade 6',
                'section' => 'Jacinto',
            ],
            [
                'school_id' => 'STU-1005',
                'first_name' => 'Sofia',
                'middle_name' => null,
                'last_name' => 'Dela Cruz',
                'year_level' => 'Grade 7',
                'section' => 'Mabini',
            ],
            [
                'school_id' => 'STU-1006',
                'first_name' => 'Gabriel',
                'middle_name' => null,
                'last_name' => 'Ramos',
                'year_level' => 'Grade 10',
                'section' => 'Rizal',
            ],
            [
                'school_id' => 'STU-1007',
                'first_name' => 'Isabella',
                'middle_name' => null,
                'last_name' => 'Aquino',
                'year_level' => 'Grade 12',
                'section' => 'STEM',
            ],
            [
                'school_id' => '2316020010',
                'first_name' => 'Shyne Audrey',
                'middle_name' => null,
                'last_name' => 'Ayunan',
                'year_level' => 'Fourth Year',
                'section' => 'Block 1',
            ],
            [
                'school_id' => '2211600042',
                'first_name' => 'Brian Angelo',
                'middle_name' => null,
                'last_name' => 'Bognot',
                'year_level' => 'Fourth Year',
                'section' => 'Block 3',
            ],
        ];
    }
}

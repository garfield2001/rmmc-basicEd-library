<?php

namespace Database\Seeders;

use App\Models\Employee;

class EmployeeSeeder extends LibraryMemberSeeder
{
    private const FAKE_EMPLOYEE_COUNT = 8;

    public function run(): void
    {
        foreach ($this->schoolEmployees() as $employee) {
            $this->createEmployeeMember($employee);
        }

        Employee::factory()
            ->count(self::FAKE_EMPLOYEE_COUNT)
            ->create();
    }

    /**
     * Add real school employee records here for testing known IDs.
     *
     * If rfid_uid is omitted, the seeder creates a random 10-digit RFID.
     * Factory employees are added separately after this list.
     *
     * @return array<int, array<string, string|null>>
     */
    private function schoolEmployees(): array
    {
        return [
            [
                'school_id' => 'EMP-2001',
                'first_name' => 'Ana',
                'middle_name' => null,
                'last_name' => 'Reyes',
                'department' => 'Faculty',
            ],
            [
                'school_id' => 'EMP-2002',
                'first_name' => 'Marco',
                'middle_name' => null,
                'last_name' => 'Villanueva',
                'department' => 'Library',
            ],
            [
                'school_id' => 'EMP-2003',
                'first_name' => 'Leah',
                'middle_name' => null,
                'last_name' => 'Mendoza',
                'department' => 'Registrar',
            ],
            [
                'school_id' => 'EMP-2004',
                'first_name' => 'Rafael',
                'middle_name' => null,
                'last_name' => 'Torres',
                'department' => 'Guidance',
            ],
            [
                'school_id' => 'OP1-308',
                'first_name' => 'Aaron',
                'middle_name' => null,
                'last_name' => 'Ayunan',
                'department' => 'Management Information Systems',
                'rfid_uid' => '0163313553',
            ],
        ];
    }
}

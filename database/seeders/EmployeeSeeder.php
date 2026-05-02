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
     * Add real school employee details here.
     * Shared member data, including RFID, lives in LibraryMemberSeeder.
     * Factory employees are added separately after this list.
     *
     * @return array<int, array<string, mixed>>
     */
    private function schoolEmployees(): array
    {
        return $this->attachManualDetails($this->manualEmployeeMembers(), [
            'EMP-2001' => [
                'department' => 'Faculty',
            ],
            'EMP-2002' => [
                'department' => 'Library',
            ],
            'EMP-2003' => [
                'department' => 'Registrar',
            ],
            'EMP-2004' => [
                'department' => 'Guidance',
            ],
            'OP1-308' => [
                'department' => 'Management Information Systems',
            ],
            /* 'OP1164' => [
                'department' => 'Para-Librarian',
            ], */
        ]);
    }
}

<?php

namespace Database\Seeders;

use App\Models\EmployeeProfile;

class EmployeeSeeder extends RegisteredVisitorSeeder
{
    public function run(): void
    {
        $this->createEmployeeMembers($this->schoolEmployees());

        foreach ($this->fakeEmployeeDepartmentPlan() as $department => $employeeCount) {
            EmployeeProfile::factory()
                ->count($employeeCount)
                ->create([
                    'department' => $department,
                ]);
        }
    }

    /**
     * Add real school employee details here.
     * Shared member data, including RFID, lives in RegisteredVisitorSeeder.
     * Factory employee profiles are added separately after this list.
     *
     * @return array<int, array<string, mixed>>
     */
    private function schoolEmployees(): array
    {
        return $this->attachManualDetails($this->manualEmployeeMembers(), [
            'EMP-2001' => [
                'department' => 'Basic Education Faculty',
            ],
            'EMP-2002' => [
                'department' => 'College of Engineering Faculty',
            ],
            'EMP-2003' => [
                'department' => 'College of Medical Technology Faculty',
            ],
            'EMP-2004' => [
                'department' => 'College of Nursing Faculty',
            ],
            'OP1-308' => [
                'department' => 'College of Information Technology Faculty',
            ],
            'OP1164' => [
                'department' => 'College of Computer Science Faculty',
            ],
        ]);
    }

    /**
     * Fake employees are grouped by teaching department so every seeded
     * employee represents teaching personnel.
     *
     * @return array<string, int>
     */
    private function fakeEmployeeDepartmentPlan(): array
    {
        return [
            'Basic Education Faculty' => 10,
            'Senior High School Faculty' => 5,
            'College of Engineering Faculty' => 5,
            'College of Medical Technology Faculty' => 5,
            'College of Nursing Faculty' => 4,
            'College of Information Technology Faculty' => 4,
            'College of Computer Science Faculty' => 3,
            'College of Teacher Education Faculty' => 3,
            'College of Business Administration Faculty' => 3,
            'College of Hospitality Management Faculty' => 2,
            'Mathematics Faculty' => 2,
            'Science Faculty' => 2,
        ];
    }
}

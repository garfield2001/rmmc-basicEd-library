<?php

namespace Database\Seeders;

use App\Models\EmployeeSchoolYearRecord;
use App\Models\LibraryMember;
use App\Models\SchoolYear;

class EmployeeSeeder extends LibraryMemberSeeder
{
    public function run(): void
    {
        $previousYear = SchoolYear::query()->where('name', '2025-2026')->firstOrFail();
        $currentYear = SchoolYear::query()->where('name', '2026-2027')->firstOrFail();

        // 1. Seed 2025-2026 employees
        $this->createEmployeeVisitors($this->schoolEmployees(), $previousYear);

        foreach ($this->fakeEmployeeDepartmentPlan() as $department => $employeeCount) {
            for ($i = 0; $i < $employeeCount; $i++) {
                EmployeeSchoolYearRecord::factory()->create([
                    'school_year_id' => $previousYear->id,
                    'department' => $department,
                ]);
            }
        }

        // 2. Transfer all employees to 2026-2027 active school year
        $this->transferEmployeesToCurrentYear($previousYear, $currentYear);
    }

    private function transferEmployeesToCurrentYear(SchoolYear $fromYear, SchoolYear $toYear): void
    {
        $employees = LibraryMember::query()
            ->where('type', LibraryMember::TYPE_EMPLOYEE)
            ->whereHas('employeeSchoolYearRecords', fn ($query) => $query->forSchoolYear($fromYear->id))
            ->with(['employeeSchoolYearRecords' => fn ($query) => $query->where('school_year_id', $fromYear->id)])
            ->get();

        foreach ($employees as $member) {
            $previousRecord = $member->employeeSchoolYearRecords->first();
            if (! $previousRecord) {
                continue;
            }

            $member->employeeSchoolYearRecords()->create([
                'school_year_id' => $toYear->id,
                'school_id' => $member->school_id,
                'rfid_uid' => $member->rfid_uid,
                'first_name' => $member->first_name,
                'middle_name' => $member->middle_name,
                'last_name' => $member->last_name,
                'photo' => $member->photo,
                'department' => $previousRecord->department,
            ]);
        }
    }

    /**
     * Add real school employee details here.
     *
     * @return array<int, array<string, mixed>>
     */
    private function schoolEmployees(): array
    {
        return $this->attachManualDetails($this->manualEmployeeVisitors(), [
            'EMP-2001' => [
                'department' => 'Elementary',
            ],
            'EMP-2002' => [
                'department' => 'Elementary',
            ],
            'EMP-2003' => [
                'department' => 'High School',
            ],
            'EMP-2004' => [
                'department' => 'High School',
            ],
            'OP1-308' => [
                'department' => 'Office Personnel',
            ],
            'OP1164' => [
                'department' => 'Office Personnel',
            ],
            'OP1-303' => [
                'department' => 'Office Personnel',
            ],
        ]);
    }

    /**
     * Fake employees are grouped by department (15-20 per department).
     *
     * @return array<string, int>
     */
    private function fakeEmployeeDepartmentPlan(): array
    {
        return [
            'Elementary' => 15,
            'High School' => 17,
            'Office Personnel' => 13,
        ];
    }
}
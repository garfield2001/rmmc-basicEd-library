<?php

namespace App\Services\SchoolYears;

use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\EmployeeProfile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SchoolYearService
{
    public function create(array $data): SchoolYear
    {
        return DB::transaction(function () use ($data): SchoolYear {
            $makeActive = (bool) ($data['make_active'] ?? true);
            $previousActiveSchoolYear = $makeActive ? SchoolYear::active()->first() : null;

            if ($makeActive) {
                SchoolYear::query()->update(['is_active' => false]);
            }

            $schoolYear = SchoolYear::create([
                'name' => $data['name'],
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'],
                'student_required_visits' => $data['student_required_visits'],
                'employee_required_visits' => $data['employee_required_visits'],
                'is_active' => $makeActive,
            ]);

            if ($previousActiveSchoolYear && ($data['transfer_employees'] ?? false)) {
                $this->transferEmployees($previousActiveSchoolYear, $schoolYear);
            }

            return $schoolYear;
        });
    }

    public function activate(SchoolYear $schoolYear): SchoolYear
    {
        throw ValidationException::withMessages([
            'school_year' => 'Previous school years cannot be reactivated after a transition. Create the next school year to move forward.',
        ]);
    }

    public function update(SchoolYear $schoolYear, array $data): SchoolYear
    {
        return DB::transaction(function () use ($schoolYear, $data): SchoolYear {
            $schoolYear->update([
                'name' => $data['name'],
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'],
                'student_required_visits' => $data['student_required_visits'],
                'employee_required_visits' => $data['employee_required_visits'],
                'is_active' => $schoolYear->is_active,
            ]);

            return $schoolYear->refresh();
        });
    }

    private function transferEmployees(SchoolYear $fromSchoolYear, SchoolYear $toSchoolYear): int
    {
        $transferred = 0;

        EmployeeProfile::query()
            ->with('visitor:id,type')
            ->where('school_year_id', $fromSchoolYear->id)
            ->orderBy('id')
            ->each(function (EmployeeProfile $employeeProfile) use ($toSchoolYear, &$transferred): void {
                if ($employeeProfile->visitor?->type !== RegisteredVisitor::TYPE_EMPLOYEE) {
                    return;
                }

                $newEmployeeProfile = EmployeeProfile::query()->firstOrCreate(
                    [
                        'registered_visitor_id' => $employeeProfile->registered_visitor_id,
                        'school_year_id' => $toSchoolYear->id,
                    ],
                    [
                        'school_id' => $employeeProfile->school_id,
                        'rfid_uid' => $employeeProfile->rfid_uid,
                        'first_name' => $employeeProfile->first_name,
                        'middle_name' => $employeeProfile->middle_name,
                        'last_name' => $employeeProfile->last_name,
                        'photo' => $employeeProfile->photo,
                        'department' => $employeeProfile->department,
                    ],
                );

                if ($newEmployeeProfile->wasRecentlyCreated) {
                    $transferred++;
                }
            });

        return $transferred;
    }
}

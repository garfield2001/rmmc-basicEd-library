<?php

namespace Database\Seeders;

use App\Models\SchoolYear;
use Illuminate\Database\Seeder;

class CurrentSchoolYear extends Seeder
{
    public function run(): void
    {
        SchoolYear::query()->update(['is_active' => false]);

        SchoolYear::query()->updateOrCreate(
            ['name' => '2026-2027'],
            [
                'starts_at' => '2026-01-08',
                'ends_at' => '2027-03-07',
                'student_required_visits' => 10,
                'employee_required_visits' => 15,
                'is_active' => true,
            ],
        );
    }
}

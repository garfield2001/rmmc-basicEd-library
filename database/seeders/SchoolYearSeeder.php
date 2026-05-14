<?php

namespace Database\Seeders;

use App\Models\SchoolYear;
use Illuminate\Database\Seeder;

class SchoolYearSeeder extends Seeder
{
    public function run(): void
    {
        SchoolYear::query()->create([
            'name' => '2025-2026',
            'starts_at' => '2025-06-01',
            'ends_at' => '2026-02-03',
            'student_required_visits' => 4,
            'employee_required_visits' => 4,
            'is_active' => false,
        ]);

        SchoolYear::query()->create([
            'name' => '2026-2027',
            'starts_at' => '2026-02-16',
            'ends_at' => '2027-03-03',
            'student_required_visits' => 4,
            'employee_required_visits' => 4,
            'is_active' => true,
        ]);
    }
}

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
            'ends_at' => '2026-03-31',
            'minimum_visits' => 3,
            'target_visits' => 4,
            'is_active' => false,
        ]);

        SchoolYear::query()->create([
            'name' => '2026-2027',
            'starts_at' => '2026-05-01',
            'ends_at' => '2027-03-07',
            'minimum_visits' => 3,
            'target_visits' => 4,
            'is_active' => true,
        ]);
    }
}

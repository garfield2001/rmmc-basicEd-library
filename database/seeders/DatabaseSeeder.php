<?php

namespace Database\Seeders;

use App\Models\EmployeeProfile;
use App\Models\LibraryVisit;
use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Models\StudentSchoolYearRecord;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        try {
            Schema::disableForeignKeyConstraints();

            LibraryVisit::truncate();
            StudentSchoolYearRecord::truncate();
            SchoolYearSection::truncate();
            EmployeeProfile::truncate();
            RegisteredVisitor::truncate();
            SchoolYear::truncate();
            User::truncate();
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        RegisteredVisitorSeeder::resetUsedRFIDs();

        User::create([
            'name' => 'RMMC Library Admin',
            'email' => 'admin@gmail.com',
            'password' => 'password',
            'role' => 'admin',
        ]);

        SchoolYear::create([
            'name' => '2025-2026',
            'starts_at' => '2025-06-01',
            'ends_at' => '2026-03-31',
            'minimum_visits' => 3,
            'target_visits' => 4,
            'is_active' => false,
        ]);

        SchoolYear::create([
            'name' => '2026-2027',
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
            'minimum_visits' => 3,
            'target_visits' => 4,
            'is_active' => true,
        ]);

        $this->call([
            StudentSeeder::class,
            EmployeeSeeder::class,
            HistoricalSchoolYearSeeder::class,
        ]);

        $this->command?->info('Admin login: admin@gmail.com / password');
    }
}

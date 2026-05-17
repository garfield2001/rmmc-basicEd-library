<?php

namespace Database\Seeders;

use App\Models\EmployeeProfile;
use App\Models\LibraryVisit;
use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Models\StudentRegistration;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        try {
            Schema::disableForeignKeyConstraints();

            LibraryVisit::truncate();
            StudentRegistration::truncate();
            SchoolYearSection::truncate();
            EmployeeProfile::truncate();
            RegisteredVisitor::truncate();
            SchoolYear::truncate();
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        RegisteredVisitorSeeder::resetUsedRFIDs();

        $this->call([
            UserSeeder::class,
            SchoolYearSeeder::class,
            StudentSeeder::class,
            EmployeeSeeder::class,
            HistoricalSchoolYearSeeder::class,
            CurrentSchoolYearVisitSeeder::class,
        ]);
    }
}

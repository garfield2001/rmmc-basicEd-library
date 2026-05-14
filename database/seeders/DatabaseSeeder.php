<?php

namespace Database\Seeders;

use App\Models\EmployeeProfile;
use App\Models\LibraryVisit;
use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Models\StudentRegistration;
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
            StudentRegistration::truncate();
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

        $this->call([
            SchoolYearSeeder::class,
            StudentSeeder::class,
            EmployeeSeeder::class,
            HistoricalSchoolYearSeeder::class,
        ]);

        $this->command?->info('Admin login: admin@gmail.com / password');
    }
}

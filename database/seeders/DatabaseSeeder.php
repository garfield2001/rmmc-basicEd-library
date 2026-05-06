<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\Student;
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
            Student::truncate();
            Employee::truncate();
            LibraryMember::truncate();
            SchoolYear::truncate();
            User::truncate();
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        LibraryMemberSeeder::resetUsedRFIDs();

        User::create([
            'name' => 'RMMC Library Admin',
            'email' => 'admin@example.com',
            'password' => 'password',
            'role' => 'admin',
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
        ]);

        $this->command?->info('Admin login: admin@example.com / password');
    }
}

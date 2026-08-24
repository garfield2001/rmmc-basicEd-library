<?php

namespace Database\Seeders;

use App\Models\EmployeeSchoolYearRecord;
use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\SchoolYearSection;
use App\Models\StudentSchoolYearRecord;
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
            EmployeeSchoolYearRecord::truncate();
            LibraryMember::truncate();
            SchoolYear::truncate();
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        LibraryMemberSeeder::resetUsedRFIDs();

        $this->call([
            UserSeeder::class,
            SchoolYearSeeder::class,
            StudentSeeder::class,
            EmployeeSeeder::class,
            LibraryVisitSeeder::class,
        ]);
    }
}

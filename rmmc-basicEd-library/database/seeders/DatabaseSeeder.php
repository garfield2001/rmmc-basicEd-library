<?php

namespace Database\Seeders;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'RMMC Library Admin',
                'password' => 'password',
                'role' => 'admin',
            ],
        );

        $previousSchoolYear = SchoolYear::updateOrCreate(
            ['name' => '2025-2026'],
            [
                'starts_at' => '2025-06-01',
                'ends_at' => '2026-03-31',
                'minimum_visits' => 3,
                'target_visits' => 4,
                'is_active' => false,
            ],
        );

        $activeSchoolYear = SchoolYear::updateOrCreate(
            ['name' => '2026-2027'],
            [
                'starts_at' => '2026-06-01',
                'ends_at' => '2027-03-31',
                'minimum_visits' => 3,
                'target_visits' => 4,
                'is_active' => true,
            ],
        );

        LibraryMember::whereIn('rfid_uid', [
            'RFID-STU-1001',
            'RFID-STU-1002',
            'RFID-STU-1003',
            'RFID-STU-1004',
            'RFID-STU-1005',
            'RFID-STU-1006',
            'RFID-STU-1007',
            'RFID-EMP-2001',
            'RFID-EMP-2002',
            'RFID-EMP-2003',
            'RFID-EMP-2004',
            '100001',
            '100002',
            '100003',
            '100004',
            '100005',
            '100006',
            '100007',
            '200001',
            '200002',
            '200003',
            '200004',
            '103023',
            '438243',
            '393259',
            '742816',
            '581604',
            '926370',
            '314985',
            '675204',
            '248731',
            '819456',
            '562190',
        ])->orWhereIn('school_id', [
            'STU-1001',
            'STU-1002',
            'STU-1003',
            'STU-1004',
            'STU-1005',
            'STU-1006',
            'STU-1007',
            'EMP-2001',
            'EMP-2002',
            'EMP-2003',
            'EMP-2004',
        ])->delete();

        $members = collect([
            $this->student('103023', 'STU-1001', 'Mikaela', 'Cruz', 'Kinder', 'Aguinaldo'),
            $this->student('438243', 'STU-1002', 'Joaquin', 'Santos', 'Grade 1', 'Bonifacio'),
            $this->student('393259', 'STU-1003', 'Althea', 'Reyes', 'Grade 4', 'Del Pilar'),
            $this->student('742816', 'STU-1004', 'Nathaniel', 'Garcia', 'Grade 6', 'Jacinto'),
            $this->student('581604', 'STU-1005', 'Sofia', 'Dela Cruz', 'Grade 7', 'Mabini'),
            $this->student('926370', 'STU-1006', 'Gabriel', 'Ramos', 'Grade 10', 'Rizal'),
            $this->student('314985', 'STU-1007', 'Isabella', 'Aquino', 'Grade 12', 'STEM'),
            $this->employee('675204', 'EMP-2001', 'Ana', 'Reyes', 'Faculty'),
            $this->employee('248731', 'EMP-2002', 'Marco', 'Villanueva', 'Library'),
            $this->employee('819456', 'EMP-2003', 'Leah', 'Mendoza', 'Registrar'),
            $this->employee('562190', 'EMP-2004', 'Rafael', 'Torres', 'Guidance'),
        ]);

        LibraryVisit::whereIn('library_member_id', $members->pluck('id'))
            ->whereIn('school_year_id', [$previousSchoolYear->id, $activeSchoolYear->id])
            ->delete();

        $today = Carbon::today();
        $visitPlan = [
            ['103023', $today->copy()->setTime(7, 42)],
            ['438243', $today->copy()->setTime(8, 5)],
            ['581604', $today->copy()->setTime(8, 18)],
            ['248731', $today->copy()->setTime(8, 32)],
            ['926370', $today->copy()->setTime(9, 12)],
            ['675204', $today->copy()->setTime(10, 4)],
            ['393259', $today->copy()->subDay()->setTime(13, 20)],
            ['742816', $today->copy()->subDays(2)->setTime(9, 35)],
            ['819456', $today->copy()->subDays(3)->setTime(11, 10)],
            ['314985', $today->copy()->subDays(4)->setTime(14, 45)],
            ['562190', $today->copy()->subDays(5)->setTime(15, 8)],
        ];

        foreach ($visitPlan as [$rfidUid, $visitedAt]) {
            LibraryVisit::create([
                'library_member_id' => $members->firstWhere('rfid_uid', $rfidUid)->id,
                'school_year_id' => $activeSchoolYear->id,
                'visited_at' => $visitedAt,
            ]);
        }

        foreach ($members->take(5) as $index => $member) {
            LibraryVisit::create([
                'library_member_id' => $member->id,
                'school_year_id' => $previousSchoolYear->id,
                'visited_at' => Carbon::parse('2026-02-10')->addDays($index)->setTime(9 + $index, 15),
            ]);
        }

        $this->command?->info('Sample admin: admin@example.com / password');
    }

    private function student(string $rfidUid, string $schoolId, string $firstName, string $lastName, string $yearLevel, string $section): LibraryMember
    {
        $member = LibraryMember::updateOrCreate(
            ['rfid_uid' => $rfidUid],
            [
                'school_id' => $schoolId,
                'type' => LibraryMember::TYPE_STUDENT,
                'first_name' => $firstName,
                'middle_name' => null,
                'last_name' => $lastName,
                'photo' => null,
                'is_active' => true,
            ],
        );

        $member->student()->updateOrCreate([], [
            'year_level' => $yearLevel,
            'section' => $section,
        ]);

        $member->employee()->delete();

        return $member->load('student');
    }

    private function employee(string $rfidUid, string $schoolId, string $firstName, string $lastName, string $department): LibraryMember
    {
        $member = LibraryMember::updateOrCreate(
            ['rfid_uid' => $rfidUid],
            [
                'school_id' => $schoolId,
                'type' => LibraryMember::TYPE_EMPLOYEE,
                'first_name' => $firstName,
                'middle_name' => null,
                'last_name' => $lastName,
                'photo' => null,
                'is_active' => true,
            ],
        );

        $member->employee()->updateOrCreate([], [
            'department' => $department,
        ]);

        $member->student()->delete();

        return $member->load('employee');
    }
}

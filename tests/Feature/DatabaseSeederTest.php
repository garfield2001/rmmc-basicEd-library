<?php

namespace Tests\Feature;

use App\Models\EmployeeSchoolYearRecord;
use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\StudentSchoolYearRecord;
use App\Models\User;
use Database\Seeders\SchoolYearSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_seeder_creates_admin_login_credentials(): void
    {
        $this->seed(UserSeeder::class);

        $admin = User::query()->where('email', 'admin@gmail.com')->firstOrFail();

        $this->assertSame('RMMC Library Admin', $admin->name);
        $this->assertSame('admin', $admin->role);
        $this->assertTrue(Hash::check('password', $admin->password));
    }

    public function test_school_year_seeder_creates_active_school_year(): void
    {
        $this->seed(SchoolYearSeeder::class);

        $previousYear = SchoolYear::query()->where('name', '2025-2026')->firstOrFail();
        $this->assertSame('2025-06-09', $previousYear->startDateString());
        $this->assertSame('2026-03-31', $previousYear->endDateString());
        $this->assertFalse($previousYear->is_active);

        $currentYear = SchoolYear::query()->where('name', '2026-2027')->firstOrFail();
        $this->assertSame('2026-06-08', $currentYear->startDateString());
        $this->assertSame('2027-03-31', $currentYear->endDateString());
        $this->assertTrue($currentYear->is_active);
    }

    public function test_database_seeder_creates_manual_and_factory_library_members_without_unique_conflicts(): void
    {
        $this->seed();

        $this->assertDatabaseHas('users', [
            'email' => 'admin@gmail.com',
            'role' => 'admin',
        ]);
        $activeSchoolYear = SchoolYear::query()->where('name', '2026-2027')->firstOrFail();
        $previousSchoolYear = SchoolYear::query()->where('name', '2025-2026')->firstOrFail();

        $this->assertSame('2026-06-08', $activeSchoolYear->startDateString());
        $this->assertSame('2027-03-31', $activeSchoolYear->endDateString());
        $this->assertTrue($activeSchoolYear->is_active);

        $manualStudent = LibraryMember::query()
            ->where('school_id', '2316020010')
            ->where('type', LibraryMember::TYPE_STUDENT)
            ->firstOrFail();

        $this->assertMatchesRegularExpression('/^\d{10}$/', $manualStudent->rfid_uid);

        $this->assertDatabaseMissing('library_members', [
            'school_id' => 'STU-1001',
        ]);

        $this->assertDatabaseHas('library_members', [
            'school_id' => 'OP1-308',
            'rfid_uid' => '0163313553',
            'type' => LibraryMember::TYPE_EMPLOYEE,
        ]);

        $this->assertSame(1, User::query()->where('email', 'admin@gmail.com')->count());
        $this->assertSame(LibraryMember::query()->count(), LibraryMember::query()->distinct('rfid_uid')->count('rfid_uid'));
        $this->assertSame(LibraryMember::query()->count(), LibraryMember::query()->distinct('school_id')->count('school_id'));
        $this->assertTrue(
            LibraryMember::query()
                ->where('type', LibraryMember::TYPE_STUDENT)
                ->pluck('school_id')
                ->every(fn (string $schoolId): bool => preg_match('/^\d{10}$/', $schoolId) === 1),
        );

        // Verify total registered visitors is a natural, realistic non-round number > 600
        $totalMembers = LibraryMember::query()->count();
        $this->assertGreaterThanOrEqual(600, $totalMembers);

        // Verify student promotion: student 2000001002 was in Grade 1 in 2025-2026 and promoted to Grade 2 in 2026-2027
        $promotedStudent = LibraryMember::query()->where('school_id', '2000001002')->firstOrFail();
        $records = $promotedStudent->studentSchoolYearRecords()->orderBy('school_year_id')->get();
        $this->assertCount(2, $records);
        $this->assertSame('Grade 1', $records[0]->year_level);
        $this->assertSame($previousSchoolYear->id, $records[0]->school_year_id);
        $this->assertSame('Grade 2', $records[1]->year_level);
        $this->assertSame($activeSchoolYear->id, $records[1]->school_year_id);

        $currentVisits = LibraryVisit::query()->where('school_year_id', $activeSchoolYear->id);
        $this->assertGreaterThanOrEqual('2026-06-08', Carbon::parse((clone $currentVisits)->min('visited_at'))->toDateString());
        $this->assertLessThanOrEqual('2027-03-31', Carbon::parse((clone $currentVisits)->max('visited_at'))->toDateString());

        $previousVisits = LibraryVisit::query()->where('school_year_id', $previousSchoolYear->id);
        $this->assertGreaterThanOrEqual('2025-06-09', Carbon::parse((clone $previousVisits)->min('visited_at'))->toDateString());
        $this->assertLessThanOrEqual('2026-03-31', Carbon::parse((clone $previousVisits)->max('visited_at'))->toDateString());

        $studentVisitCounts = $this->seededVisitCounts(LibraryMember::TYPE_STUDENT, $activeSchoolYear->id);
        $employeeVisitCounts = $this->seededVisitCounts(LibraryMember::TYPE_EMPLOYEE, $activeSchoolYear->id);

        foreach ([$studentVisitCounts, $employeeVisitCounts] as $visitCounts) {
            $this->assertTrue($visitCounts->contains(0));
            $this->assertTrue($visitCounts->contains(fn (int $count): bool => $count > 0 && $count <= 2));
            $this->assertTrue($visitCounts->contains(fn (int $count): bool => $count >= 5));
        }

        $this->assertGreaterThan((int) floor($studentVisitCounts->count() * 0.7), $studentVisitCounts->filter(fn (int $count): bool => $count > 0)->count());
        $this->assertGreaterThan((int) floor($employeeVisitCounts->count() * 0.7), $employeeVisitCounts->filter(fn (int $count): bool => $count > 0)->count());
        $this->assertTrue($studentVisitCounts->contains(fn (int $count): bool => $count >= $activeSchoolYear->student_required_visits));
        $this->assertTrue($employeeVisitCounts->contains(fn (int $count): bool => $count >= $activeSchoolYear->employee_required_visits));

        $employeeDepartments = [
            'Elementary',
            'High School',
            'Office Personnel',
        ];

        $this->assertTrue(
            EmployeeSchoolYearRecord::query()
                ->where('school_year_id', $activeSchoolYear->id)
                ->pluck('department')
                ->every(fn (string $department): bool => in_array($department, $employeeDepartments, true)),
        );

        foreach ($employeeDepartments as $department) {
            $count = EmployeeSchoolYearRecord::query()->where('school_year_id', $activeSchoolYear->id)->where('department', $department)->count();
            $this->assertGreaterThanOrEqual(15, $count);
            $this->assertLessThanOrEqual(20, $count);
        }

        $studentSchoolYearRecords = StudentSchoolYearRecord::query()->where('school_year_id', $activeSchoolYear->id);

        foreach (['Kindergarten 1', 'Kindergarten 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 7', 'Grade 9'] as $yearLevel) {
            $this->assertSame(
                1,
                (clone $studentSchoolYearRecords)
                    ->where('year_level', $yearLevel)
                    ->distinct('section')
                    ->count('section'),
                "Expected {$yearLevel} to have 1 section",
            );
        }

        $this->assertSame(
            3,
            (clone $studentSchoolYearRecords)
                ->where('year_level', 'Grade 6')
                ->distinct('section')
                ->count('section'),
            'Expected Grade 6 to have 3 sections',
        );

        foreach (['Grade 8', 'Grade 10'] as $yearLevel) {
            $this->assertSame(
                2,
                (clone $studentSchoolYearRecords)
                    ->where('year_level', $yearLevel)
                    ->distinct('section')
                    ->count('section'),
                "Expected {$yearLevel} to have 2 sections",
            );
        }

        (clone $studentSchoolYearRecords)
            ->selectRaw('year_level, section, count(*) as student_count')
            ->groupBy('year_level', 'section')
            ->get()
            ->each(function ($section): void {
                $this->assertGreaterThanOrEqual(25, $section->student_count);
                $this->assertLessThanOrEqual(30, $section->student_count);
            });

        $sectionsUsedByMultipleYearLevels = (clone $studentSchoolYearRecords)
            ->selectRaw('section, count(distinct year_level) as year_level_count')
            ->groupBy('section')
            ->having('year_level_count', '>', 1)
            ->pluck('section');

        $this->assertCount(0, $sectionsUsedByMultipleYearLevels);
    }

    private function seededVisitCounts(string $type, int $schoolYearId)
    {
        $relation = $type === LibraryMember::TYPE_STUDENT ? 'studentSchoolYearRecords' : 'employeeSchoolYearRecords';

        return LibraryMember::query()
            ->where('type', $type)
            ->whereHas($relation, fn ($query) => $query->forSchoolYear($schoolYearId))
            ->withCount(['visits as seeded_visits_count' => fn ($query) => $query->where('school_year_id', $schoolYearId)])
            ->pluck('seeded_visits_count');
    }
}
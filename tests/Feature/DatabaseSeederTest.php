<?php

namespace Tests\Feature;

use App\Models\EmployeeSchoolYearRecord;
use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\StudentSchoolYearRecord;
use App\Models\User;
use Database\Seeders\CurrentSchoolYear;
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

    public function test_current_school_year_seeder_creates_active_school_year(): void
    {
        $this->seed(CurrentSchoolYear::class);

        $schoolYear = SchoolYear::query()->where('name', '2026-2027')->firstOrFail();

        $this->assertSame('2026-01-08', $schoolYear->startDateString());
        $this->assertSame('2027-03-07', $schoolYear->endDateString());
        $this->assertTrue($schoolYear->is_active);
    }

    public function test_database_seeder_creates_manual_and_factory_library_members_without_unique_conflicts(): void
    {
        $this->seed();

        $this->assertDatabaseHas('users', [
            'email' => 'admin@gmail.com',
            'role' => 'admin',
        ]);
        $activeSchoolYear = SchoolYear::query()->where('name', '2026-2027')->firstOrFail();

        $this->assertSame('2026-01-08', $activeSchoolYear->startDateString());
        $this->assertSame('2027-03-07', $activeSchoolYear->endDateString());
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
        $this->assertGreaterThanOrEqual(600, StudentSchoolYearRecord::query()->count());
        $this->assertGreaterThanOrEqual(50, EmployeeSchoolYearRecord::query()->count());
        $currentVisits = LibraryVisit::query()->where('school_year_id', $activeSchoolYear->id);
        $this->assertSame('2026-01-08', Carbon::parse((clone $currentVisits)->min('visited_at'))->toDateString());
        $this->assertSame('2026-05-25', Carbon::parse((clone $currentVisits)->max('visited_at'))->toDateString());
        $this->assertGreaterThanOrEqual(
            100,
            (clone $currentVisits)
                ->pluck('visited_at')
                ->map(fn ($visitedAt): string => Carbon::parse($visitedAt)->toDateString())
                ->unique()
                ->count(),
        );
        $studentVisitCounts = $this->seededVisitCounts(LibraryMember::TYPE_STUDENT, $activeSchoolYear->id);
        $employeeVisitCounts = $this->seededVisitCounts(LibraryMember::TYPE_EMPLOYEE, $activeSchoolYear->id);

        foreach ([$studentVisitCounts, $employeeVisitCounts] as $visitCounts) {
            $this->assertTrue($visitCounts->contains(0));
            $this->assertTrue($visitCounts->contains(fn (int $count): bool => $count > 0 && $count <= 2));
            $this->assertTrue($visitCounts->contains(fn (int $count): bool => $count >= 5 && $count <= 6));
        }

        $this->assertGreaterThan((int) floor($studentVisitCounts->count() * 0.7), $studentVisitCounts->filter(fn (int $count): bool => $count > 0)->count());
        $this->assertGreaterThan((int) floor($employeeVisitCounts->count() * 0.7), $employeeVisitCounts->filter(fn (int $count): bool => $count > 0)->count());
        $this->assertTrue($studentVisitCounts->contains(fn (int $count): bool => $count >= $activeSchoolYear->student_required_visits));
        $this->assertTrue($employeeVisitCounts->contains(fn (int $count): bool => $count >= $activeSchoolYear->employee_required_visits));

        $previousSchoolYear = SchoolYear::query()->where('name', '2025-2026')->firstOrFail();
        $previousVisits = LibraryVisit::query()->where('school_year_id', $previousSchoolYear->id);
        $this->assertGreaterThan(500, (clone $previousVisits)->count());
        $this->assertGreaterThanOrEqual($previousSchoolYear->startDateString(), Carbon::parse((clone $previousVisits)->min('visited_at'))->toDateString());
        $this->assertLessThanOrEqual($previousSchoolYear->endDateString(), Carbon::parse((clone $previousVisits)->max('visited_at'))->toDateString());

        $employeeDepartments = [
            'Integration School Faculty',
            'Senior High School Faculty',
            'College of Engineering Faculty',
            'College of Medical Technology Faculty',
            'College of Nursing Faculty',
            'College of Information Technology Faculty',
            'College of Computer Science Faculty',
            'College of Teacher Education Faculty',
            'College of Business Administration Faculty',
            'College of Hospitality Management Faculty',
            'Mathematics Faculty',
            'Science Faculty',
            'Management Information Systems',
        ];

        $this->assertTrue(
            EmployeeSchoolYearRecord::query()
                ->pluck('department')
                ->every(fn (string $department): bool => in_array($department, $employeeDepartments, true)),
        );

        $studentSchoolYearRecords = StudentSchoolYearRecord::query()->where('school_year_id', $activeSchoolYear->id);

        foreach (['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'] as $yearLevel) {
            $this->assertSame(
                1,
                (clone $studentSchoolYearRecords)
                    ->where('year_level', $yearLevel)
                    ->distinct('section')
                    ->count('section'),
            );
        }

        foreach (['Grade 5', 'Grade 6'] as $yearLevel) {
            $sectionCount = (clone $studentSchoolYearRecords)
                ->where('year_level', $yearLevel)
                ->distinct('section')
                ->count('section');

            $this->assertGreaterThanOrEqual(2, $sectionCount);
            $this->assertLessThanOrEqual(3, $sectionCount);
        }

        (clone $studentSchoolYearRecords)
            ->selectRaw('year_level, section, count(*) as student_count')
            ->groupBy('year_level', 'section')
            ->get()
            ->each(function ($section): void {
                $this->assertGreaterThanOrEqual(25, $section->student_count);
                $this->assertLessThanOrEqual(35, $section->student_count);
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

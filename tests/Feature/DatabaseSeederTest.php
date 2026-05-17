<?php

namespace Tests\Feature;

use App\Models\EmployeeProfile;
use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\StudentRegistration;
use App\Models\User;
use Database\Seeders\CurrentSchoolYear;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

        $this->assertSame('2026-05-01', $schoolYear->starts_at->toDateString());
        $this->assertSame('2027-03-07', $schoolYear->ends_at->toDateString());
        $this->assertTrue($schoolYear->is_active);
    }

    public function test_database_seeder_creates_manual_and_factory_registered_visitors_without_unique_conflicts(): void
    {
        $this->seed();

        $this->assertDatabaseHas('users', [
            'email' => 'admin@gmail.com',
            'role' => 'admin',
        ]);
        $activeSchoolYear = SchoolYear::query()->where('name', '2026-2027')->firstOrFail();

        $this->assertSame('2026-05-01', $activeSchoolYear->starts_at->toDateString());
        $this->assertSame('2027-03-07', $activeSchoolYear->ends_at->toDateString());
        $this->assertTrue($activeSchoolYear->is_active);

        $manualStudent = RegisteredVisitor::query()
            ->where('school_id', '2316020010')
            ->where('type', RegisteredVisitor::TYPE_STUDENT)
            ->firstOrFail();

        $this->assertMatchesRegularExpression('/^\d{10}$/', $manualStudent->rfid_uid);

        $this->assertDatabaseMissing('registered_visitors', [
            'school_id' => 'STU-1001',
        ]);

        $this->assertDatabaseHas('registered_visitors', [
            'school_id' => 'OP1-308',
            'rfid_uid' => '0163313553',
            'type' => RegisteredVisitor::TYPE_EMPLOYEE,
        ]);

        $this->assertSame(1, User::query()->where('email', 'admin@gmail.com')->count());
        $this->assertSame(RegisteredVisitor::query()->count(), RegisteredVisitor::query()->distinct('rfid_uid')->count('rfid_uid'));
        $this->assertSame(RegisteredVisitor::query()->count(), RegisteredVisitor::query()->distinct('school_id')->count('school_id'));
        $this->assertTrue(
            RegisteredVisitor::query()
                ->where('type', RegisteredVisitor::TYPE_STUDENT)
                ->pluck('school_id')
                ->every(fn (string $schoolId): bool => preg_match('/^\d{10}$/', $schoolId) === 1),
        );
        $this->assertGreaterThanOrEqual(600, StudentRegistration::query()->count());
        $this->assertGreaterThanOrEqual(50, EmployeeProfile::query()->count());

        $employeeDepartments = [
            'Basic Education Faculty',
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
            EmployeeProfile::query()
                ->pluck('department')
                ->every(fn (string $department): bool => in_array($department, $employeeDepartments, true)),
        );

        $studentRegistrations = StudentRegistration::query()->where('school_year_id', $activeSchoolYear->id);

        foreach (['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'] as $yearLevel) {
            $this->assertSame(
                1,
                (clone $studentRegistrations)
                    ->where('year_level', $yearLevel)
                    ->distinct('section')
                    ->count('section'),
            );
        }

        foreach (['Grade 5', 'Grade 6'] as $yearLevel) {
            $sectionCount = (clone $studentRegistrations)
                ->where('year_level', $yearLevel)
                ->distinct('section')
                ->count('section');

            $this->assertGreaterThanOrEqual(2, $sectionCount);
            $this->assertLessThanOrEqual(3, $sectionCount);
        }

        (clone $studentRegistrations)
            ->selectRaw('year_level, section, count(*) as student_count')
            ->groupBy('year_level', 'section')
            ->get()
            ->each(function ($section): void {
                $this->assertGreaterThanOrEqual(25, $section->student_count);
                $this->assertLessThanOrEqual(35, $section->student_count);
            });
    }
}

<?php

namespace Tests\Feature;

use App\Models\EmployeeProfile;
use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\StudentSchoolYearRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_creates_manual_and_factory_registered_visitors_without_unique_conflicts(): void
    {
        $this->seed();

        $this->assertDatabaseHas('users', [
            'email' => 'admin@gmail.com',
            'role' => 'admin',
        ]);

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
        $this->assertGreaterThanOrEqual(600, StudentSchoolYearRecord::query()->count());
        $this->assertGreaterThanOrEqual(50, EmployeeProfile::query()->count());

        $teachingDepartments = [
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
        ];

        $this->assertTrue(
            EmployeeProfile::query()
                ->pluck('department')
                ->every(fn (string $department): bool => in_array($department, $teachingDepartments, true)),
        );

        $activeSchoolYearId = SchoolYear::query()->where('name', '2026-2027')->value('id');
        $studentSchoolYearRecords = StudentSchoolYearRecord::query()->where('school_year_id', $activeSchoolYearId);

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
    }
}

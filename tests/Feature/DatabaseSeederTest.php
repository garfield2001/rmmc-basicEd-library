<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\LibraryMember;
use App\Models\StudentEnrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_creates_manual_members_and_factory_members_without_unique_conflicts(): void
    {
        $this->seed();

        $this->assertDatabaseHas('users', [
            'email' => 'admin@example.com',
            'role' => 'admin',
        ]);

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

        $this->assertSame(1, User::query()->where('email', 'admin@example.com')->count());
        $this->assertSame(LibraryMember::query()->count(), LibraryMember::query()->distinct('rfid_uid')->count('rfid_uid'));
        $this->assertSame(LibraryMember::query()->count(), LibraryMember::query()->distinct('school_id')->count('school_id'));
        $this->assertTrue(
            LibraryMember::query()
                ->where('type', LibraryMember::TYPE_STUDENT)
                ->pluck('school_id')
                ->every(fn (string $schoolId): bool => preg_match('/^\d{10}$/', $schoolId) === 1),
        );
        $this->assertGreaterThanOrEqual(600, StudentEnrollment::query()->count());
        $this->assertGreaterThanOrEqual(50, Employee::query()->count());

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
            Employee::query()
                ->pluck('department')
                ->every(fn (string $department): bool => in_array($department, $teachingDepartments, true)),
        );

        $studentEnrollments = StudentEnrollment::query();

        foreach (['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'] as $yearLevel) {
            $this->assertSame(
                1,
                (clone $studentEnrollments)
                    ->where('year_level', $yearLevel)
                    ->distinct('section')
                    ->count('section'),
            );
        }

        foreach (['Grade 5', 'Grade 6'] as $yearLevel) {
            $sectionCount = (clone $studentEnrollments)
                ->where('year_level', $yearLevel)
                ->distinct('section')
                ->count('section');

            $this->assertGreaterThanOrEqual(2, $sectionCount);
            $this->assertLessThanOrEqual(3, $sectionCount);
        }

        (clone $studentEnrollments)
            ->selectRaw('year_level, section, count(*) as student_count')
            ->groupBy('year_level', 'section')
            ->get()
            ->each(function ($section): void {
                $this->assertGreaterThanOrEqual(25, $section->student_count);
                $this->assertLessThanOrEqual(35, $section->student_count);
            });
    }
}

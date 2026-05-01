<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\LibraryMember;
use App\Models\Student;
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
        $this->assertSame(26, Student::query()->count());
        $this->assertSame(14, Employee::query()->count());
    }
}

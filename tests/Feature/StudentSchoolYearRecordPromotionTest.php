<?php

namespace Tests\Feature;

use App\Models\EmployeeSchoolYearRecord;
use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\StudentSchoolYearRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentSchoolYearRecordPromotionTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_active_school_year_starts_with_fresh_student_roster(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $sourceSchoolYear = SchoolYear::factory()->active()->create([
            'name' => '2025-2026',
            'starts_at' => '2025-06-01',
            'ends_at' => '2026-03-31',
        ]);
        $kindergartenOne = LibraryMember::factory()->student()->create();
        $kindergartenTwo = LibraryMember::factory()->student()->create();
        $gradeSix = LibraryMember::factory()->student()->create();
        $gradeTen = LibraryMember::factory()->student()->create();

        StudentSchoolYearRecord::factory()->create([
            'library_member_id' => $kindergartenOne->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Kindergarten 1',
            'section' => 'Aguinaldo',
        ]);
        StudentSchoolYearRecord::factory()->create([
            'library_member_id' => $kindergartenTwo->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Kindergarten 2',
            'section' => 'Bonifacio',
        ]);
        StudentSchoolYearRecord::factory()->create([
            'library_member_id' => $gradeSix->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Grade 6',
            'section' => 'Rizal',
        ]);
        StudentSchoolYearRecord::factory()->create([
            'library_member_id' => $gradeTen->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Grade 10',
            'section' => 'Mabini',
        ]);

        $this->actingAs($admin)->post('/admin/school-years', [
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
            'student_required_visits' => 3,
            'employee_required_visits' => 4,
        ])->assertSessionHas('success');

        $targetSchoolYear = SchoolYear::query()->where('name', '2026-2027')->firstOrFail();

        $this->assertSame(0, StudentSchoolYearRecord::query()->where('school_year_id', $targetSchoolYear->id)->count());
        $this->assertDatabaseHas('library_members', ['id' => $kindergartenOne->id]);
        $this->assertDatabaseHas('library_members', ['id' => $kindergartenTwo->id]);
        $this->assertDatabaseHas('library_members', ['id' => $gradeSix->id]);
        $this->assertDatabaseHas('library_members', ['id' => $gradeTen->id]);
    }

    public function test_admin_can_choose_to_transfer_employees_when_creating_active_school_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $sourceSchoolYear = SchoolYear::factory()->active()->create([
            'name' => '2025-2026',
            'starts_at' => '2025-06-01',
            'ends_at' => '2026-03-31',
        ]);
        $employee = LibraryMember::factory()->employee()->create([
            'first_name' => 'Ana',
            'last_name' => 'Reyes',
        ]);

        EmployeeSchoolYearRecord::factory()->create([
            'library_member_id' => $employee->id,
            'school_year_id' => $sourceSchoolYear->id,
            'department' => 'Faculty',
        ]);

        $this->actingAs($admin)->post('/admin/school-years', [
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
            'student_required_visits' => 3,
            'employee_required_visits' => 4,
            'transfer_employees' => true,
        ])->assertSessionHas('success');

        $targetSchoolYear = SchoolYear::query()->where('name', '2026-2027')->firstOrFail();

        $this->assertDatabaseHas('employee_school_year_records', [
            'library_member_id' => $employee->id,
            'school_year_id' => $targetSchoolYear->id,
            'department' => 'Faculty',
        ]);
    }

    public function test_admin_can_update_school_year_details_from_shared_navbar_workflow(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create([
            'name' => '2026-2027',
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
            'student_required_visits' => 3,
            'employee_required_visits' => 4,
        ]);

        $this->actingAs($admin)->patch("/admin/school-years/{$schoolYear->id}", [
            'starts_at' => '2026-06-15',
            'ends_at' => '2027-04-15',
            'student_required_visits' => 4,
            'employee_required_visits' => 6,
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('school_years', [
            'id' => $schoolYear->id,
            'name' => '2026-2027',
            'student_required_visits' => 4,
            'employee_required_visits' => 6,
            'is_active' => true,
        ]);
    }

    public function test_admin_cannot_transition_to_overlapping_school_year_dates(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        SchoolYear::factory()->active()->create([
            'name' => '2025-2026',
            'starts_at' => '2025-06-01',
            'ends_at' => '2026-03-31',
        ]);

        $this->actingAs($admin)->post('/admin/school-years', [
            'starts_at' => '2026-03-01',
            'ends_at' => '2027-03-31',
            'student_required_visits' => 3,
            'employee_required_visits' => 4,
        ])->assertSessionHasErrors([
            'starts_at' => 'This school year overlaps 2025-2026 (Jun-01-2025 to Mar-31-2026).',
        ]);

        $this->assertDatabaseMissing('school_years', [
            'name' => '2026-2027',
        ]);
    }

    public function test_admin_cannot_create_next_school_year_before_latest_school_year_ends(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        SchoolYear::factory()->create([
            'name' => '2025-2026',
            'starts_at' => '2025-06-01',
            'ends_at' => '2026-03-01',
        ]);
        SchoolYear::factory()->create([
            'name' => '2026-2027',
            'starts_at' => '2026-06-04',
            'ends_at' => '2027-03-05',
        ]);

        $this->actingAs($admin)->post('/admin/school-years', [
            'starts_at' => '2026-03-02',
            'ends_at' => '2026-06-03',
            'student_required_visits' => 3,
            'employee_required_visits' => 4,
        ])->assertSessionHasErrors([
            'starts_at' => 'The next school year must start after 2026-2027 ends (Mar-05-2027).',
        ]);

        $this->assertDatabaseMissing('school_years', [
            'name' => '2026-2026',
        ]);
    }

    public function test_admin_can_create_first_school_year_with_flexible_manual_dates(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post('/admin/school-years', [
            'starts_at' => 'mar 1 2026',
            'ends_at' => '3 1, 2027',
            'student_required_visits' => 3,
            'employee_required_visits' => 4,
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('school_years', [
            'name' => '2026-2027',
            'starts_at' => '2026-03-01 00:00:00',
            'ends_at' => '2027-03-01 00:00:00',
        ]);
    }

    public function test_admin_cannot_update_school_year_to_overlap_another_school_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        SchoolYear::factory()->create([
            'name' => '2025-2026',
            'starts_at' => '2025-06-01',
            'ends_at' => '2026-03-31',
        ]);
        $schoolYear = SchoolYear::factory()->active()->create([
            'name' => '2026-2027',
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
        ]);

        $this->actingAs($admin)->patch("/admin/school-years/{$schoolYear->id}", [
            'starts_at' => '2026-03-15',
            'ends_at' => '2027-03-31',
            'student_required_visits' => 3,
            'employee_required_visits' => 4,
        ])->assertSessionHasErrors('starts_at');
    }
}

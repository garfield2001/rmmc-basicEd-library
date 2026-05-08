<?php

namespace Tests\Feature;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\StudentEnrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentPromotionTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_active_school_year_promotes_existing_students_with_blank_sections(): void
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

        StudentEnrollment::factory()->create([
            'library_member_id' => $kindergartenOne->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Kindergarten 1',
            'section' => 'Aguinaldo',
        ]);
        StudentEnrollment::factory()->create([
            'library_member_id' => $kindergartenTwo->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Kindergarten 2',
            'section' => 'Bonifacio',
        ]);
        StudentEnrollment::factory()->create([
            'library_member_id' => $gradeSix->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Grade 6',
            'section' => 'Rizal',
        ]);
        StudentEnrollment::factory()->create([
            'library_member_id' => $gradeTen->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Grade 10',
            'section' => 'Mabini',
        ]);

        $this->actingAs($admin)->post('/admin/school-years', [
            'name' => '2026-2027',
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
            'minimum_visits' => 3,
            'target_visits' => 4,
            'make_active' => true,
        ])->assertSessionHas('success');

        $targetSchoolYear = SchoolYear::query()->where('name', '2026-2027')->firstOrFail();

        $this->assertDatabaseHas('student_enrollments', [
            'library_member_id' => $kindergartenOne->id,
            'school_year_id' => $targetSchoolYear->id,
            'year_level' => 'Kindergarten 2',
            'section' => null,
            'school_year_section_id' => null,
        ]);
        $this->assertDatabaseHas('student_enrollments', [
            'library_member_id' => $kindergartenTwo->id,
            'school_year_id' => $targetSchoolYear->id,
            'year_level' => 'Grade 1',
            'section' => null,
            'school_year_section_id' => null,
        ]);
        $this->assertDatabaseHas('student_enrollments', [
            'library_member_id' => $gradeSix->id,
            'school_year_id' => $targetSchoolYear->id,
            'year_level' => 'Grade 7',
            'section' => null,
            'school_year_section_id' => null,
        ]);
        $this->assertDatabaseHas('student_enrollments', [
            'library_member_id' => $gradeTen->id,
            'school_year_id' => $targetSchoolYear->id,
            'year_level' => 'Grade 10',
            'section' => null,
            'school_year_section_id' => null,
        ]);
    }

    public function test_admin_can_update_school_year_details_from_shared_navbar_workflow(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create([
            'name' => '2026-2027',
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
            'minimum_visits' => 3,
            'target_visits' => 4,
        ]);

        $this->actingAs($admin)->patch("/admin/school-years/{$schoolYear->id}", [
            'name' => '2026-2027 Updated',
            'starts_at' => '2026-06-15',
            'ends_at' => '2027-04-15',
            'minimum_visits' => 4,
            'target_visits' => 6,
            'make_active' => true,
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('school_years', [
            'id' => $schoolYear->id,
            'name' => '2026-2027 Updated',
            'minimum_visits' => 4,
            'target_visits' => 6,
            'is_active' => true,
        ]);
    }
}

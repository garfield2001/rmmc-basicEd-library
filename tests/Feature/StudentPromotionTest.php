<?php

namespace Tests\Feature;

use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\StudentSchoolYearRecord;
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
        $kindergartenOne = RegisteredVisitor::factory()->student()->create();
        $kindergartenTwo = RegisteredVisitor::factory()->student()->create();
        $gradeSix = RegisteredVisitor::factory()->student()->create();
        $gradeTen = RegisteredVisitor::factory()->student()->create();

        StudentSchoolYearRecord::factory()->create([
            'registered_visitor_id' => $kindergartenOne->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Kindergarten 1',
            'section' => 'Aguinaldo',
        ]);
        StudentSchoolYearRecord::factory()->create([
            'registered_visitor_id' => $kindergartenTwo->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Kindergarten 2',
            'section' => 'Bonifacio',
        ]);
        StudentSchoolYearRecord::factory()->create([
            'registered_visitor_id' => $gradeSix->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Grade 6',
            'section' => 'Rizal',
        ]);
        StudentSchoolYearRecord::factory()->create([
            'registered_visitor_id' => $gradeTen->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Grade 10',
            'section' => 'Mabini',
        ]);

        $this->actingAs($admin)->post('/admin/school-years', [
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
            'minimum_visits' => 3,
            'target_visits' => 4,
        ])->assertSessionHas('success');

        $targetSchoolYear = SchoolYear::query()->where('name', '2026-2027')->firstOrFail();

        $this->assertDatabaseHas('student_school_year_records', [
            'registered_visitor_id' => $kindergartenOne->id,
            'school_year_id' => $targetSchoolYear->id,
            'year_level' => 'Kindergarten 2',
            'section' => null,
            'school_year_section_id' => null,
        ]);
        $this->assertDatabaseHas('student_school_year_records', [
            'registered_visitor_id' => $kindergartenTwo->id,
            'school_year_id' => $targetSchoolYear->id,
            'year_level' => 'Grade 1',
            'section' => null,
            'school_year_section_id' => null,
        ]);
        $this->assertDatabaseHas('student_school_year_records', [
            'registered_visitor_id' => $gradeSix->id,
            'school_year_id' => $targetSchoolYear->id,
            'year_level' => 'Grade 7',
            'section' => null,
            'school_year_section_id' => null,
        ]);
        $this->assertSoftDeleted('registered_visitors', ['id' => $gradeTen->id]);
        $this->assertDatabaseMissing('student_school_year_records', [
            'registered_visitor_id' => $gradeTen->id,
            'school_year_id' => $targetSchoolYear->id,
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
            'starts_at' => '2026-06-15',
            'ends_at' => '2027-04-15',
            'minimum_visits' => 4,
            'target_visits' => 6,
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('school_years', [
            'id' => $schoolYear->id,
            'name' => '2026-2027',
            'minimum_visits' => 4,
            'target_visits' => 6,
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
            'minimum_visits' => 3,
            'target_visits' => 4,
        ])->assertSessionHasErrors([
            'starts_at' => 'This school year overlaps 2025-2026 (Jun-01-2025 to Mar-31-2026).',
        ]);

        $this->assertDatabaseMissing('school_years', [
            'name' => '2026-2027',
        ]);
    }

    public function test_admin_can_create_non_overlapping_school_year_inside_calendar_gap(): void
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
            'minimum_visits' => 3,
            'target_visits' => 4,
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('school_years', [
            'name' => '2026-2026',
            'starts_at' => '2026-03-02 00:00:00',
            'ends_at' => '2026-06-03 00:00:00',
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
            'minimum_visits' => 3,
            'target_visits' => 4,
        ])->assertSessionHasErrors('starts_at');
    }
}

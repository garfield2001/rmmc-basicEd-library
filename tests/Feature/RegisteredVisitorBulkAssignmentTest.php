<?php

namespace Tests\Feature;

use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\StudentSchoolYearRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegisteredVisitorBulkAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_preview_student_details_and_bulk_assign_section_from_registered_visitors(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();
        $student = RegisteredVisitor::factory()->student()->create(['school_id' => '2609010003']);

        StudentSchoolYearRecord::factory()->create([
            'registered_visitor_id' => $student->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 2',
            'section' => 'Old Section',
        ]);

        $this->actingAs($admin)->postJson('/admin/registered-visitors/preview-student-assignment', [
            'student_ids' => "2609010003\nUNKNOWN\n2609010003",
            'section' => 'Sampaguita',
        ])
            ->assertOk()
            ->assertJsonPath('preview.inputCount', 3)
            ->assertJsonPath('preview.uniqueCount', 2)
            ->assertJsonPath('preview.matchedCount', 1)
            ->assertJsonPath('preview.notFoundIds.0', 'UNKNOWN')
            ->assertJsonPath('preview.duplicateIds.0', '2609010003')
            ->assertJsonPath('preview.memberIds.0', $student->id)
            ->assertJsonPath('preview.targetSection', 'Sampaguita')
            ->assertJsonPath('preview.matchedStudents.0.currentYearLevel', 'Grade 2')
            ->assertJsonPath('preview.matchedStudents.0.currentSection', 'Old Section');

        $this->actingAs($admin)->patch('/admin/registered-visitors/bulk-assign-students', [
            'member_ids' => [$student->id],
            'section' => 'Sampaguita',
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('student_school_year_records', [
            'registered_visitor_id' => $student->id,
            'year_level' => 'Grade 2',
            'section' => 'Sampaguita',
        ]);
    }

    public function test_registered_visitors_page_shows_students_from_active_school_year_only(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $oldSchoolYear = SchoolYear::factory()->create(['name' => '2025-2026']);
        $activeSchoolYear = SchoolYear::factory()->active()->create(['name' => '2026-2027']);
        $student = RegisteredVisitor::factory()->student()->create();

        StudentSchoolYearRecord::factory()->create([
            'registered_visitor_id' => $student->id,
            'school_year_id' => $oldSchoolYear->id,
            'year_level' => 'Grade 1',
            'section' => 'Rizal',
        ]);

        $this->actingAs($admin)->get('/admin/registered-visitors?type=student')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/registered-visitors/index')
                ->where('members.data', [])
            );

        StudentSchoolYearRecord::factory()->create([
            'registered_visitor_id' => $student->id,
            'school_year_id' => $activeSchoolYear->id,
            'year_level' => 'Grade 2',
            'section' => null,
        ]);

        $this->actingAs($admin)->get('/admin/registered-visitors?type=student')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/registered-visitors/index')
                ->has('members.data', 1)
            );
    }
}

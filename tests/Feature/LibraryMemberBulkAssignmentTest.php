<?php

namespace Tests\Feature;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\StudentEnrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LibraryMemberBulkAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_preview_student_details_and_bulk_assign_section_from_members(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();
        $student = LibraryMember::factory()->student()->create(['school_id' => '2609010003']);

        StudentEnrollment::factory()->create([
            'library_member_id' => $student->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 2',
            'section' => 'Old Section',
        ]);

        $this->actingAs($admin)->postJson('/admin/members/preview-student-assignment', [
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

        $this->actingAs($admin)->patch('/admin/members/bulk-assign-students', [
            'member_ids' => [$student->id],
            'section' => 'Sampaguita',
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('student_enrollments', [
            'library_member_id' => $student->id,
            'year_level' => 'Grade 2',
            'section' => 'Sampaguita',
        ]);
    }

    public function test_library_members_page_shows_students_from_active_school_year_only(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $oldSchoolYear = SchoolYear::factory()->create(['name' => '2025-2026']);
        $activeSchoolYear = SchoolYear::factory()->active()->create(['name' => '2026-2027']);
        $student = LibraryMember::factory()->student()->create();

        StudentEnrollment::factory()->create([
            'library_member_id' => $student->id,
            'school_year_id' => $oldSchoolYear->id,
            'year_level' => 'Grade 1',
            'section' => 'Rizal',
        ]);

        $this->actingAs($admin)->get('/admin/members?type=student')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/members/index')
                ->where('members.data', [])
            );

        StudentEnrollment::factory()->create([
            'library_member_id' => $student->id,
            'school_year_id' => $activeSchoolYear->id,
            'year_level' => 'Grade 2',
            'section' => null,
        ]);

        $this->actingAs($admin)->get('/admin/members?type=student')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/members/index')
                ->has('members.data', 1)
            );
    }
}

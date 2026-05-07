<?php

namespace Tests\Feature;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\StudentEnrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentEnrollmentPlacementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_assign_year_level_without_section_then_add_section_later(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();
        $student = LibraryMember::factory()->student()->create(['school_id' => '2609010003']);

        $this->actingAs($admin)->patch('/admin/student-enrollments/bulk-assign', [
            'school_year_id' => $schoolYear->id,
            'member_ids' => [$student->id],
            'year_level' => 'Grade 2',
            'section' => '',
            'status' => 'pending',
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('student_enrollments', [
            'library_member_id' => $student->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 2',
            'section' => null,
            'school_year_section_id' => null,
            'status' => 'pending',
        ]);

        $this->actingAs($admin)->patch('/admin/student-enrollments/bulk-assign', [
            'school_year_id' => $schoolYear->id,
            'member_ids' => [$student->id],
            'year_level' => 'Grade 2',
            'section' => 'Sampaguita',
            'status' => 'pending',
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('student_enrollments', [
            'library_member_id' => $student->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 2',
            'section' => 'Sampaguita',
            'status' => 'pending',
        ]);
    }

    public function test_library_members_students_only_show_active_school_year_enrollments(): void
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
            'status' => 'enrolled',
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
            'status' => 'pending',
        ]);

        $this->actingAs($admin)->get('/admin/members?type=student')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/members/index')
                ->has('members.data', 1)
            );
    }

    public function test_creating_active_school_year_does_not_auto_place_students(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $sourceSchoolYear = SchoolYear::factory()->active()->create([
            'name' => '2025-2026',
            'starts_at' => '2025-06-01',
            'ends_at' => '2026-03-31',
        ]);
        $gradeOne = LibraryMember::factory()->student()->create();

        StudentEnrollment::factory()->create([
            'library_member_id' => $gradeOne->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Grade 1',
            'section' => 'Rizal',
            'status' => 'enrolled',
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

        $this->assertDatabaseMissing('student_enrollments', [
            'library_member_id' => $gradeOne->id,
            'school_year_id' => $targetSchoolYear->id,
        ]);
    }

    public function test_admin_can_place_all_students_matching_source_filters_into_target_school_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $sourceSchoolYear = SchoolYear::factory()->create(['name' => '2025-2026']);
        $targetSchoolYear = SchoolYear::factory()->active()->create(['name' => '2026-2027']);
        $matchingStudent = LibraryMember::factory()->student()->create();
        $otherStudent = LibraryMember::factory()->student()->create();

        StudentEnrollment::factory()->create([
            'library_member_id' => $matchingStudent->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Grade 1',
            'section' => 'Rizal',
            'status' => 'enrolled',
        ]);
        StudentEnrollment::factory()->create([
            'library_member_id' => $otherStudent->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Grade 1',
            'section' => 'Mabini',
            'status' => 'enrolled',
        ]);

        $this->actingAs($admin)->patch('/admin/student-enrollments/bulk-assign', [
            'school_year_id' => $targetSchoolYear->id,
            'select_all' => true,
            'filters' => [
                'source_school_year_id' => $sourceSchoolYear->id,
                'source_year_level' => 'Grade 1',
                'source_section' => 'Rizal',
            ],
            'year_level' => 'Grade 2',
            'section' => '',
            'status' => 'pending',
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('student_enrollments', [
            'library_member_id' => $matchingStudent->id,
            'school_year_id' => $targetSchoolYear->id,
            'year_level' => 'Grade 2',
            'section' => null,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('student_enrollments', [
            'library_member_id' => $matchingStudent->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Grade 1',
            'section' => 'Rizal',
            'status' => 'enrolled',
        ]);
        $this->assertDatabaseMissing('student_enrollments', [
            'library_member_id' => $otherStudent->id,
            'school_year_id' => $targetSchoolYear->id,
        ]);
    }

    public function test_admin_can_preview_pasted_student_ids_before_placement(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $sourceSchoolYear = SchoolYear::factory()->create(['name' => '2025-2026']);
        $targetSchoolYear = SchoolYear::factory()->active()->create(['name' => '2026-2027']);
        $student = LibraryMember::factory()->student()->create(['school_id' => '2609010001', 'is_active' => true]);
        $alreadyPlaced = LibraryMember::factory()->student()->create(['school_id' => '2609010002', 'is_active' => false]);

        StudentEnrollment::factory()->create([
            'library_member_id' => $student->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Grade 1',
            'section' => 'Rizal',
            'status' => 'enrolled',
        ]);
        StudentEnrollment::factory()->create([
            'library_member_id' => $alreadyPlaced->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Grade 1',
            'section' => 'Rizal',
            'status' => 'enrolled',
        ]);
        StudentEnrollment::factory()->create([
            'library_member_id' => $alreadyPlaced->id,
            'school_year_id' => $targetSchoolYear->id,
            'year_level' => 'Grade 2',
            'section' => 'Mabini',
            'status' => 'pending',
        ]);

        $this->actingAs($admin)->postJson('/admin/student-enrollments/preview-roster', [
            'school_year_id' => $targetSchoolYear->id,
            'student_ids' => "2609010001\n2609010002\n2609010002\nUNKNOWN",
            'year_level' => 'Grade 2',
            'section' => 'Sampaguita',
            'filters' => [
                'source_school_year_id' => $sourceSchoolYear->id,
                'source_year_level' => 'Grade 1',
            ],
        ])
            ->assertOk()
            ->assertJsonPath('preview.inputCount', 4)
            ->assertJsonPath('preview.uniqueCount', 3)
            ->assertJsonPath('preview.matchedCount', 2)
            ->assertJsonPath('preview.notFoundIds.0', 'UNKNOWN')
            ->assertJsonPath('preview.duplicateIds.0', '2609010002')
            ->assertJsonPath('preview.alreadyPlaced.0.schoolId', '2609010002')
            ->assertJsonPath('preview.inactiveStudents.0.schoolId', '2609010002');
    }

    public function test_pasted_student_id_preview_blocks_demotions(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $sourceSchoolYear = SchoolYear::factory()->create(['name' => '2025-2026']);
        $targetSchoolYear = SchoolYear::factory()->active()->create(['name' => '2026-2027']);
        $student = LibraryMember::factory()->student()->create(['school_id' => '2609010003']);

        StudentEnrollment::factory()->create([
            'library_member_id' => $student->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Grade 3',
            'section' => 'Rizal',
            'status' => 'enrolled',
        ]);

        $this->actingAs($admin)->postJson('/admin/student-enrollments/preview-roster', [
            'school_year_id' => $targetSchoolYear->id,
            'student_ids' => '2609010003',
            'year_level' => 'Grade 2',
            'section' => '',
            'filters' => [
                'source_school_year_id' => $sourceSchoolYear->id,
            ],
        ])
            ->assertOk()
            ->assertJsonPath('preview.assignableCount', 0)
            ->assertJsonPath('preview.memberIds', [])
            ->assertJsonPath('preview.demotionStudents.0.schoolId', '2609010003');
    }

    public function test_student_placement_table_is_empty_when_source_and_target_are_the_same_school_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create(['name' => '2026-2027']);
        $student = LibraryMember::factory()->student()->create();

        StudentEnrollment::factory()->create([
            'library_member_id' => $student->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 1',
            'section' => 'Rizal',
            'status' => 'enrolled',
        ]);

        $this->actingAs($admin)->get("/admin/student-enrollments?source_school_year_id={$schoolYear->id}&target_school_year_id={$schoolYear->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/student-enrollments/index')
                ->where('students.data', [])
                ->where('options.hasDistinctSchoolYears', false)
            );
    }

    public function test_admin_cannot_place_students_into_the_same_source_school_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create(['name' => '2026-2027']);
        $student = LibraryMember::factory()->student()->create();

        StudentEnrollment::factory()->create([
            'library_member_id' => $student->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 1',
            'section' => 'Rizal',
            'status' => 'enrolled',
        ]);

        $this->actingAs($admin)->from('/admin/student-enrollments')->patch('/admin/student-enrollments/bulk-assign', [
            'school_year_id' => $schoolYear->id,
            'member_ids' => [$student->id],
            'filters' => [
                'source_school_year_id' => $schoolYear->id,
                'source_year_level' => 'Grade 1',
            ],
            'year_level' => 'Grade 2',
            'section' => '',
            'status' => 'pending',
        ])->assertRedirect('/admin/student-enrollments')
            ->assertSessionHasErrors('school_year_id');
    }

    public function test_admin_cannot_transfer_student_to_lower_year_level(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $sourceSchoolYear = SchoolYear::factory()->create(['name' => '2025-2026']);
        $targetSchoolYear = SchoolYear::factory()->active()->create(['name' => '2026-2027']);
        $student = LibraryMember::factory()->student()->create();

        StudentEnrollment::factory()->create([
            'library_member_id' => $student->id,
            'school_year_id' => $sourceSchoolYear->id,
            'year_level' => 'Grade 2',
            'section' => 'Rizal',
            'status' => 'enrolled',
        ]);

        $this->actingAs($admin)->from('/admin/student-enrollments')->patch('/admin/student-enrollments/bulk-assign', [
            'school_year_id' => $targetSchoolYear->id,
            'member_ids' => [$student->id],
            'filters' => [
                'source_school_year_id' => $sourceSchoolYear->id,
                'source_year_level' => 'Grade 2',
            ],
            'year_level' => 'Grade 1',
            'section' => '',
            'status' => 'pending',
        ])->assertRedirect('/admin/student-enrollments')
            ->assertSessionHasErrors('year_level');

        $this->assertDatabaseMissing('student_enrollments', [
            'library_member_id' => $student->id,
            'school_year_id' => $targetSchoolYear->id,
        ]);
    }
}

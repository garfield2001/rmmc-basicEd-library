<?php

namespace Tests\Feature;

use App\Models\RegisteredVisitor;
use App\Models\SchoolYear;
use App\Models\StudentSchoolYearRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminRegisteredVisitorTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_student_registered_visitor(): void
    {
        Storage::shouldReceive('disk')->with('member_photos')->andReturn(new class
        {
            public function putFileAs(string $path, mixed $file, string $name): string
            {
                return $name;
            }

            public function delete(?string $fileName): bool
            {
                return true;
            }
        });

        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();

        $response = $this->actingAs($admin)->post('/admin/registered-visitors', [
            'rfid_uid' => '1000000101',
            'school_id' => 'STU-001',
            'type' => RegisteredVisitor::TYPE_STUDENT,
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'photo_file' => $this->fakeJpegUpload(),
            'is_active' => true,
            'year_level' => 'Grade 10',
            'section' => 'Faraday',
        ]);

        $response->assertRedirect('/admin/registered-visitors?type=student');
        $member = RegisteredVisitor::where('rfid_uid', '1000000101')->firstOrFail();
        $this->assertSame('STU-001', $member->school_id);
        $this->assertSame(RegisteredVisitor::TYPE_STUDENT, $member->type);
        $this->assertNotNull($member->photo);
        $this->assertStringEndsWith('.jpg', $member->photo);
        $this->assertDatabaseHas('student_school_year_records', [
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 10',
            'section' => 'Faraday',
        ]);
    }

    public function test_admin_can_create_employee_registered_visitor(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post('/admin/registered-visitors', [
            'rfid_uid' => '2000000101',
            'school_id' => 'EMP-001',
            'type' => RegisteredVisitor::TYPE_EMPLOYEE,
            'first_name' => 'Ana',
            'last_name' => 'Reyes',
            'is_active' => true,
            'department' => 'Faculty',
        ]);

        $response->assertRedirect('/admin/registered-visitors?type=employee');
        $this->assertDatabaseHas('registered_visitors', [
            'rfid_uid' => '2000000101',
            'type' => RegisteredVisitor::TYPE_EMPLOYEE,
        ]);
        $this->assertDatabaseHas('employee_profiles', [
            'department' => 'Faculty',
        ]);
    }

    public function test_admin_cannot_create_registered_visitor_with_existing_rfid_or_school_id(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        RegisteredVisitor::factory()->employee()->create([
            'rfid_uid' => '2000000101',
            'school_id' => 'EMP-001',
        ]);

        $this->actingAs($admin)->post('/admin/registered-visitors', [
            'rfid_uid' => '2000000101',
            'school_id' => 'EMP-001',
            'type' => RegisteredVisitor::TYPE_EMPLOYEE,
            'first_name' => 'Ana',
            'last_name' => 'Reyes',
            'is_active' => true,
            'department' => 'Faculty',
        ])->assertSessionHasErrors([
            'rfid_uid' => 'This RFID Unique ID is already assigned to another registered visitor.',
            'school_id' => 'This School ID is already assigned to another registered visitor.',
        ]);
    }

    public function test_admin_can_sort_registered_visitors_by_school_id(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();

        $laterStudent = RegisteredVisitor::factory()->student()->create(['school_id' => '2609010002']);
        $earlierStudent = RegisteredVisitor::factory()->student()->create(['school_id' => '2609010001']);

        foreach ([$laterStudent, $earlierStudent] as $student) {
            StudentSchoolYearRecord::factory()->create([
                'registered_visitor_id' => $student->id,
                'school_year_id' => $schoolYear->id,
                'year_level' => 'Grade 1',
                'section' => 'Rizal',
            ]);
        }

        $this->actingAs($admin)->get('/admin/registered-visitors?type=student&sort=school_id&direction=asc')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/registered-visitors/index')
                ->where('members.data.0.school_id', '2609010001')
                ->where('filters.sort', 'school_id')
                ->where('filters.direction', 'asc')
            );
    }

    public function test_admin_can_view_all_registered_visitor_rows(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();

        RegisteredVisitor::factory()
            ->student()
            ->count(12)
            ->create()
            ->each(function (RegisteredVisitor $student) use ($schoolYear): void {
                StudentSchoolYearRecord::factory()->create([
                    'registered_visitor_id' => $student->id,
                    'school_year_id' => $schoolYear->id,
                    'year_level' => 'Grade 1',
                    'section' => 'Rizal',
                ]);
            });

        $this->actingAs($admin)->get('/admin/registered-visitors?type=student&per_page=all')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/registered-visitors/index')
                ->has('members.data', 12)
                ->where('filters.per_page', 'all')
            );
    }

    public function test_admin_can_copy_filtered_registered_visitor_columns_across_all_matching_rows(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();
        $matchingStudents = RegisteredVisitor::factory()
            ->student()
            ->count(3)
            ->sequence(
                ['school_id' => '2609010003'],
                ['school_id' => '2609010001'],
                ['school_id' => '2609010002'],
            )
            ->create();
        $otherStudent = RegisteredVisitor::factory()->student()->create(['school_id' => '2609010004']);

        $matchingStudents->each(function (RegisteredVisitor $student) use ($schoolYear): void {
            StudentSchoolYearRecord::factory()->create([
                'registered_visitor_id' => $student->id,
                'school_year_id' => $schoolYear->id,
                'year_level' => 'Grade 5',
                'section' => 'Rizal',
            ]);
        });

        StudentSchoolYearRecord::factory()->create([
            'registered_visitor_id' => $otherStudent->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 6',
            'section' => 'Rizal',
        ]);

        $this->actingAs($admin)->postJson('/admin/registered-visitors/copy-columns', [
            'type' => RegisteredVisitor::TYPE_STUDENT,
            'columns' => ['school_id'],
            'year_level' => 'Grade 5',
            'sort' => 'school_id',
            'direction' => 'asc',
        ])
            ->assertOk()
            ->assertJsonPath('rowCount', 3)
            ->assertJsonPath('text', "2609010001\n2609010002\n2609010003");
    }

    public function test_admin_can_view_restore_export_and_permanently_delete_archived_registered_visitor(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();
        $member = RegisteredVisitor::factory()->student()->create([
            'school_id' => '2609010001',
            'first_name' => 'Juan',
            'last_name' => 'Santos',
        ]);

        StudentSchoolYearRecord::factory()->create([
            'registered_visitor_id' => $member->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 5',
            'section' => 'Rizal',
        ]);

        $member->delete();

        $this->actingAs($admin)->get('/admin/registered-visitors/archive?type=student')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/registered-visitors/archive')
                ->where('members.data.0.school_id', '2609010001')
            );

        $this->actingAs($admin)->get('/admin/registered-visitors/archive/export?type=student')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.ms-excel');

        $this->actingAs($admin)->patch("/admin/registered-visitors/archive/{$member->id}/restore")
            ->assertRedirect('/admin/registered-visitors/archive?type=student');
        $this->assertNotSoftDeleted('registered_visitors', ['id' => $member->id]);

        $member->delete();

        $this->actingAs($admin)->delete("/admin/registered-visitors/archive/{$member->id}")
            ->assertRedirect('/admin/registered-visitors/archive');
        $this->assertDatabaseMissing('registered_visitors', ['id' => $member->id]);
    }

    public function test_archive_can_filter_archived_students_by_school_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $oldSchoolYear = SchoolYear::factory()->create([
            'name' => '2025-2026',
            'starts_at' => '2025-06-01',
            'ends_at' => '2026-03-31',
        ]);
        $activeSchoolYear = SchoolYear::factory()->active()->create([
            'name' => '2026-2027',
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
        ]);
        $oldArchivedStudent = RegisteredVisitor::factory()->student()->create(['school_id' => '2609010001']);
        $activeArchivedStudent = RegisteredVisitor::factory()->student()->create(['school_id' => '2609010002']);

        StudentSchoolYearRecord::factory()->create([
            'registered_visitor_id' => $oldArchivedStudent->id,
            'school_year_id' => $oldSchoolYear->id,
            'year_level' => 'Grade 10',
            'section' => 'Mabini',
        ]);
        StudentSchoolYearRecord::factory()->create([
            'registered_visitor_id' => $activeArchivedStudent->id,
            'school_year_id' => $activeSchoolYear->id,
            'year_level' => 'Grade 5',
            'section' => 'Rizal',
        ]);

        $oldArchivedStudent->delete();
        $activeArchivedStudent->delete();

        $this->actingAs($admin)->get("/admin/registered-visitors/archive?type=student&school_year_id={$oldSchoolYear->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('members.data.0.school_id', '2609010001')
                ->where('members.data.0.student.year_level', 'Grade 10')
                ->missing('members.data.1')
            );
    }

    public function test_restoring_archived_graduate_returns_student_to_active_school_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $oldSchoolYear = SchoolYear::factory()->create([
            'name' => '2025-2026',
            'starts_at' => '2025-06-01',
            'ends_at' => '2026-03-31',
        ]);
        $activeSchoolYear = SchoolYear::factory()->active()->create([
            'name' => '2026-2027',
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
        ]);
        $member = RegisteredVisitor::factory()->student()->create();

        StudentSchoolYearRecord::factory()->create([
            'registered_visitor_id' => $member->id,
            'school_year_id' => $oldSchoolYear->id,
            'year_level' => 'Grade 10',
            'section' => 'Mabini',
        ]);

        $member->delete();

        $this->actingAs($admin)->patch("/admin/registered-visitors/archive/{$member->id}/restore")
            ->assertRedirect('/admin/registered-visitors/archive?type=student');

        $this->assertNotSoftDeleted('registered_visitors', ['id' => $member->id]);
        $this->assertDatabaseHas('student_school_year_records', [
            'registered_visitor_id' => $member->id,
            'school_year_id' => $activeSchoolYear->id,
            'year_level' => 'Grade 10',
            'section' => null,
            'school_year_section_id' => null,
        ]);
    }

    public function test_admin_can_bulk_delete_and_export_delete_archived_registered_visitors(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();
        $members = RegisteredVisitor::factory()->student()->count(3)->create();

        $members->each(function (RegisteredVisitor $member) use ($schoolYear): void {
            StudentSchoolYearRecord::factory()->create([
                'registered_visitor_id' => $member->id,
                'school_year_id' => $schoolYear->id,
                'year_level' => 'Grade 5',
                'section' => 'Rizal',
            ]);
            $member->delete();
        });

        $this->actingAs($admin)->delete('/admin/registered-visitors/archive/bulk', [
            'member_ids' => $members->take(2)->pluck('id')->all(),
            'type' => RegisteredVisitor::TYPE_STUDENT,
        ])->assertRedirect('/admin/registered-visitors/archive?type=student');

        $this->assertDatabaseMissing('registered_visitors', ['id' => $members[0]->id]);
        $this->assertDatabaseMissing('registered_visitors', ['id' => $members[1]->id]);
        $this->assertSoftDeleted('registered_visitors', ['id' => $members[2]->id]);

        $this->actingAs($admin)->get('/admin/registered-visitors/archive/export?type=student&delete_after_export=1')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.ms-excel');

        $this->assertDatabaseMissing('registered_visitors', ['id' => $members[2]->id]);
    }

    public function test_admin_can_bulk_archive_registered_visitors(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $members = RegisteredVisitor::factory()->employee()->count(3)->create();

        $this->actingAs($admin)->delete('/admin/registered-visitors/bulk', [
            'member_ids' => $members->take(2)->pluck('id')->all(),
            'type' => RegisteredVisitor::TYPE_EMPLOYEE,
        ])->assertRedirect('/admin/registered-visitors?type=employee');

        $this->assertSoftDeleted('registered_visitors', ['id' => $members[0]->id]);
        $this->assertSoftDeleted('registered_visitors', ['id' => $members[1]->id]);
        $this->assertNotSoftDeleted('registered_visitors', ['id' => $members[2]->id]);
    }

    public function test_admin_can_bulk_archive_all_filtered_registered_visitors(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();
        $matchingStudents = RegisteredVisitor::factory()->student()->count(3)->create();
        $otherStudent = RegisteredVisitor::factory()->student()->create();

        $matchingStudents->each(function (RegisteredVisitor $student) use ($schoolYear): void {
            StudentSchoolYearRecord::factory()->create([
                'registered_visitor_id' => $student->id,
                'school_year_id' => $schoolYear->id,
                'year_level' => 'Grade 5',
                'section' => 'Rizal',
            ]);
        });
        StudentSchoolYearRecord::factory()->create([
            'registered_visitor_id' => $otherStudent->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 6',
            'section' => 'Rizal',
        ]);

        $this->actingAs($admin)->delete('/admin/registered-visitors/bulk', [
            'select_all' => true,
            'type' => RegisteredVisitor::TYPE_STUDENT,
            'year_level' => 'Grade 5',
        ])->assertRedirect('/admin/registered-visitors?type=student');

        $matchingStudents->each(fn (RegisteredVisitor $student) => $this->assertSoftDeleted('registered_visitors', ['id' => $student->id]));
        $this->assertNotSoftDeleted('registered_visitors', ['id' => $otherStudent->id]);
    }

    public function test_non_admin_can_not_access_registered_visitor_management(): void
    {
        $user = User::factory()->create(['role' => 'librarian']);

        $this->actingAs($user)->get('/admin/registered-visitors')->assertForbidden();
    }

    private function fakeJpegUpload(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'member-photo');

        file_put_contents($path, base64_decode('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGAf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8BP//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8BP//Z'));

        return new UploadedFile($path, 'maria.jpg', 'image/jpeg', null, true);
    }
}

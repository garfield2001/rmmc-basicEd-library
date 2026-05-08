<?php

namespace Tests\Feature;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
use App\Models\StudentEnrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminMemberTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_student_member(): void
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

        $response = $this->actingAs($admin)->post('/admin/members', [
            'rfid_uid' => '1000000101',
            'school_id' => 'STU-001',
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'photo_file' => $this->fakeJpegUpload(),
            'is_active' => true,
            'year_level' => 'Grade 10',
            'section' => 'Faraday',
        ]);

        $response->assertRedirect('/admin/members?type=student');
        $member = LibraryMember::where('rfid_uid', '1000000101')->firstOrFail();
        $this->assertSame('STU-001', $member->school_id);
        $this->assertSame(LibraryMember::TYPE_STUDENT, $member->type);
        $this->assertNotNull($member->photo);
        $this->assertStringEndsWith('.jpg', $member->photo);
        $this->assertDatabaseHas('student_enrollments', [
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 10',
            'section' => 'Faraday',
        ]);
    }

    public function test_admin_can_create_employee_member(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post('/admin/members', [
            'rfid_uid' => '2000000101',
            'school_id' => 'EMP-001',
            'type' => LibraryMember::TYPE_EMPLOYEE,
            'first_name' => 'Ana',
            'last_name' => 'Reyes',
            'is_active' => true,
            'department' => 'Faculty',
        ]);

        $response->assertRedirect('/admin/members?type=employee');
        $this->assertDatabaseHas('library_members', [
            'rfid_uid' => '2000000101',
            'type' => LibraryMember::TYPE_EMPLOYEE,
        ]);
        $this->assertDatabaseHas('employees', [
            'department' => 'Faculty',
        ]);
    }

    public function test_admin_cannot_create_member_with_existing_rfid_or_school_id(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        LibraryMember::factory()->employee()->create([
            'rfid_uid' => '2000000101',
            'school_id' => 'EMP-001',
        ]);

        $this->actingAs($admin)->post('/admin/members', [
            'rfid_uid' => '2000000101',
            'school_id' => 'EMP-001',
            'type' => LibraryMember::TYPE_EMPLOYEE,
            'first_name' => 'Ana',
            'last_name' => 'Reyes',
            'is_active' => true,
            'department' => 'Faculty',
        ])->assertSessionHasErrors([
            'rfid_uid' => 'This RFID Unique ID is already assigned to another library member.',
            'school_id' => 'This School ID is already assigned to another library member.',
        ]);
    }

    public function test_admin_can_sort_members_by_school_id(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();

        $laterStudent = LibraryMember::factory()->student()->create(['school_id' => '2609010002']);
        $earlierStudent = LibraryMember::factory()->student()->create(['school_id' => '2609010001']);

        foreach ([$laterStudent, $earlierStudent] as $student) {
            StudentEnrollment::factory()->create([
                'library_member_id' => $student->id,
                'school_year_id' => $schoolYear->id,
                'year_level' => 'Grade 1',
                'section' => 'Rizal',
            ]);
        }

        $this->actingAs($admin)->get('/admin/members?type=student&sort=school_id&direction=asc')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/members/index')
                ->where('members.data.0.school_id', '2609010001')
                ->where('filters.sort', 'school_id')
                ->where('filters.direction', 'asc')
            );
    }

    public function test_admin_can_view_all_member_rows(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();

        LibraryMember::factory()
            ->student()
            ->count(12)
            ->create()
            ->each(function (LibraryMember $student) use ($schoolYear): void {
                StudentEnrollment::factory()->create([
                    'library_member_id' => $student->id,
                    'school_year_id' => $schoolYear->id,
                    'year_level' => 'Grade 1',
                    'section' => 'Rizal',
                ]);
            });

        $this->actingAs($admin)->get('/admin/members?type=student&per_page=all')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/members/index')
                ->has('members.data', 12)
                ->where('filters.per_page', 'all')
            );
    }

    public function test_admin_can_copy_filtered_member_columns_across_all_matching_rows(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();
        $matchingStudents = LibraryMember::factory()
            ->student()
            ->count(3)
            ->sequence(
                ['school_id' => '2609010003'],
                ['school_id' => '2609010001'],
                ['school_id' => '2609010002'],
            )
            ->create();
        $otherStudent = LibraryMember::factory()->student()->create(['school_id' => '2609010004']);

        $matchingStudents->each(function (LibraryMember $student) use ($schoolYear): void {
            StudentEnrollment::factory()->create([
                'library_member_id' => $student->id,
                'school_year_id' => $schoolYear->id,
                'year_level' => 'Grade 5',
                'section' => 'Rizal',
            ]);
        });

        StudentEnrollment::factory()->create([
            'library_member_id' => $otherStudent->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 6',
            'section' => 'Rizal',
        ]);

        $this->actingAs($admin)->postJson('/admin/members/copy-columns', [
            'type' => LibraryMember::TYPE_STUDENT,
            'columns' => ['school_id'],
            'year_level' => 'Grade 5',
            'sort' => 'school_id',
            'direction' => 'asc',
        ])
            ->assertOk()
            ->assertJsonPath('rowCount', 3)
            ->assertJsonPath('text', "2609010001\n2609010002\n2609010003");
    }

    public function test_admin_can_view_restore_export_and_permanently_delete_archived_member(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();
        $member = LibraryMember::factory()->student()->create([
            'school_id' => '2609010001',
            'first_name' => 'Juan',
            'last_name' => 'Santos',
        ]);

        StudentEnrollment::factory()->create([
            'library_member_id' => $member->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 5',
            'section' => 'Rizal',
        ]);

        $member->delete();

        $this->actingAs($admin)->get('/admin/members/archive?type=student')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/members/archive')
                ->where('members.data.0.school_id', '2609010001')
            );

        $this->actingAs($admin)->get('/admin/members/archive/export?type=student')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.ms-excel');

        $this->actingAs($admin)->patch("/admin/members/archive/{$member->id}/restore")
            ->assertRedirect('/admin/members/archive?type=student');
        $this->assertNotSoftDeleted('library_members', ['id' => $member->id]);

        $member->delete();

        $this->actingAs($admin)->delete("/admin/members/archive/{$member->id}")
            ->assertRedirect('/admin/members/archive');
        $this->assertDatabaseMissing('library_members', ['id' => $member->id]);
    }

    public function test_admin_can_bulk_archive_members(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $members = LibraryMember::factory()->employee()->count(3)->create();

        $this->actingAs($admin)->delete('/admin/members/bulk', [
            'member_ids' => $members->take(2)->pluck('id')->all(),
            'type' => LibraryMember::TYPE_EMPLOYEE,
        ])->assertRedirect('/admin/members?type=employee');

        $this->assertSoftDeleted('library_members', ['id' => $members[0]->id]);
        $this->assertSoftDeleted('library_members', ['id' => $members[1]->id]);
        $this->assertNotSoftDeleted('library_members', ['id' => $members[2]->id]);
    }

    public function test_admin_can_bulk_archive_all_filtered_members(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();
        $matchingStudents = LibraryMember::factory()->student()->count(3)->create();
        $otherStudent = LibraryMember::factory()->student()->create();

        $matchingStudents->each(function (LibraryMember $student) use ($schoolYear): void {
            StudentEnrollment::factory()->create([
                'library_member_id' => $student->id,
                'school_year_id' => $schoolYear->id,
                'year_level' => 'Grade 5',
                'section' => 'Rizal',
            ]);
        });
        StudentEnrollment::factory()->create([
            'library_member_id' => $otherStudent->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 6',
            'section' => 'Rizal',
        ]);

        $this->actingAs($admin)->delete('/admin/members/bulk', [
            'select_all' => true,
            'type' => LibraryMember::TYPE_STUDENT,
            'year_level' => 'Grade 5',
        ])->assertRedirect('/admin/members?type=student');

        $matchingStudents->each(fn (LibraryMember $student) => $this->assertSoftDeleted('library_members', ['id' => $student->id]));
        $this->assertNotSoftDeleted('library_members', ['id' => $otherStudent->id]);
    }

    public function test_non_admin_can_not_access_member_management(): void
    {
        $user = User::factory()->create(['role' => 'librarian']);

        $this->actingAs($user)->get('/admin/members')->assertForbidden();
    }

    private function fakeJpegUpload(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'member-photo');

        file_put_contents($path, base64_decode('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGAf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8BP//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8BP//Z'));

        return new UploadedFile($path, 'maria.jpg', 'image/jpeg', null, true);
    }
}

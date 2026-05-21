<?php

namespace Tests\Feature;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\StudentSchoolYearRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminLibraryMemberTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_student_registered_visitor(): void
    {
        Storage::shouldReceive('disk')->with('visitor_photos')->andReturn(new class
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
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'photo_file' => $this->fakeJpegUpload(),
            'is_active' => true,
            'year_level' => 'Grade 10',
            'section' => 'Faraday',
        ]);

        $response->assertRedirect('/admin/registered-visitors?type=student');
        $visitor = LibraryMember::where('rfid_uid', '1000000101')->firstOrFail();
        $this->assertSame('STU-001', $visitor->school_id);
        $this->assertSame(LibraryMember::TYPE_STUDENT, $visitor->type);
        $this->assertNotNull($visitor->photo);
        $this->assertStringEndsWith('.jpg', $visitor->photo);
        $this->assertDatabaseHas('student_school_year_records', [
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 10',
            'section' => 'Faraday',
        ]);
    }

    public function test_admin_can_create_employee_registered_visitor(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        SchoolYear::factory()->active()->create();

        $response = $this->actingAs($admin)->post('/admin/registered-visitors', [
            'rfid_uid' => '2000000101',
            'school_id' => 'EMP-001',
            'type' => LibraryMember::TYPE_EMPLOYEE,
            'first_name' => 'Ana',
            'last_name' => 'Reyes',
            'is_active' => true,
            'department' => 'Faculty',
        ]);

        $response->assertRedirect('/admin/registered-visitors?type=employee');
        $this->assertDatabaseHas('library_members', [
            'rfid_uid' => '2000000101',
            'type' => LibraryMember::TYPE_EMPLOYEE,
        ]);
        $this->assertDatabaseHas('employee_school_year_records', [
            'department' => 'Faculty',
        ]);
    }

    public function test_admin_can_create_visitor_without_rfid_or_school_id(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();

        $this->actingAs($admin)->post('/admin/registered-visitors', [
            'rfid_uid' => '',
            'school_id' => '',
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'year_level' => 'Grade 5',
            'section' => 'Rizal',
        ])->assertRedirect('/admin/registered-visitors?type=student');

        $visitor = LibraryMember::query()->where('first_name', 'Juan')->where('last_name', 'Dela Cruz')->firstOrFail();

        $this->assertNull($visitor->rfid_uid);
        $this->assertNull($visitor->school_id);
        $this->assertDatabaseHas('student_school_year_records', [
            'library_member_id' => $visitor->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 5',
            'section' => 'Rizal',
        ]);
    }

    public function test_admin_cannot_create_registered_visitor_with_existing_rfid_or_school_id(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        LibraryMember::factory()->employee()->create([
            'rfid_uid' => '2000000101',
            'school_id' => 'EMP-001',
        ]);

        $this->actingAs($admin)->post('/admin/registered-visitors', [
            'rfid_uid' => '2000000101',
            'school_id' => 'EMP-001',
            'type' => LibraryMember::TYPE_EMPLOYEE,
            'first_name' => 'Ana',
            'last_name' => 'Reyes',
            'is_active' => true,
            'department' => 'Faculty',
        ])->assertSessionHasErrors([
            'rfid_uid' => 'This RFID Unique ID is already assigned to another registered visitor.',
            'school_id' => 'This School ID is already assigned to another registered visitor.',
        ]);
    }

    public function test_student_visitors_default_to_highest_grade_then_name(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();

        $gradeOneStudent = LibraryMember::factory()->student()->create([
            'school_id' => '2609010001',
            'first_name' => 'Zoe',
            'last_name' => 'Young',
        ]);
        $secondGradeTenStudent = LibraryMember::factory()->student()->create([
            'school_id' => '2609010002',
            'first_name' => 'Ben',
            'last_name' => 'Zulu',
        ]);
        $firstGradeTenStudent = LibraryMember::factory()->student()->create([
            'school_id' => '2609010003',
            'first_name' => 'Ana',
            'last_name' => 'Alpha',
        ]);

        foreach ([
            [$gradeOneStudent, 'Grade 1'],
            [$secondGradeTenStudent, 'Grade 10'],
            [$firstGradeTenStudent, 'Grade 10'],
        ] as [$student, $yearLevel]) {
            StudentSchoolYearRecord::factory()->create([
                'library_member_id' => $student->id,
                'school_year_id' => $schoolYear->id,
                'year_level' => $yearLevel,
                'section' => 'Rizal',
            ]);
        }

        $this->actingAs($admin)->get('/admin/registered-visitors?type=student')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/registered-visitors/index')
                ->where('visitors.data.0.school_id', '2609010003')
                ->where('visitors.data.1.school_id', '2609010002')
                ->where('visitors.data.2.school_id', '2609010001')
                ->where('filters.sort', 'year_level')
                ->where('filters.direction', 'desc')
            );
    }

    public function test_admin_can_view_all_registered_visitor_rows(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();

        LibraryMember::factory()
            ->student()
            ->count(12)
            ->create()
            ->each(function (LibraryMember $student) use ($schoolYear): void {
                StudentSchoolYearRecord::factory()->create([
                    'library_member_id' => $student->id,
                    'school_year_id' => $schoolYear->id,
                    'year_level' => 'Grade 1',
                    'section' => 'Rizal',
                ]);
            });

        $this->actingAs($admin)->get('/admin/registered-visitors?type=student&per_page=all')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/registered-visitors/index')
                ->has('visitors.data', 12)
                ->where('filters.per_page', 'all')
            );
    }

    public function test_duplicate_unresolved_visitors_are_hidden_until_identifier_merge(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();
        $first = LibraryMember::factory()->student()->create([
            'rfid_uid' => null,
            'school_id' => null,
            'first_name' => 'Maria',
            'middle_name' => null,
            'last_name' => 'Santos',
        ]);
        $second = LibraryMember::factory()->student()->create([
            'rfid_uid' => null,
            'school_id' => null,
            'first_name' => 'Maria',
            'middle_name' => null,
            'last_name' => 'Santos',
        ]);

        foreach ([$first, $second] as $student) {
            StudentSchoolYearRecord::factory()->create([
                'library_member_id' => $student->id,
                'school_year_id' => $schoolYear->id,
                'year_level' => 'Grade 5',
                'section' => 'Rizal',
            ]);
        }

        $this->actingAs($admin)->get('/admin/registered-visitors?type=student&per_page=all')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/registered-visitors/index')
                ->has('visitors.data', 1)
                ->where('visitors.data.0.id', $first->id)
                ->where('visitors.data.0.duplicate_count', 1)
            );
    }

    public function test_admin_confirms_merge_when_identifier_is_added_to_duplicate_group(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();
        $keeper = LibraryMember::factory()->student()->create([
            'rfid_uid' => null,
            'school_id' => null,
            'first_name' => 'Maria',
            'middle_name' => null,
            'last_name' => 'Santos',
        ]);
        $duplicate = LibraryMember::factory()->student()->create([
            'rfid_uid' => null,
            'school_id' => null,
            'first_name' => 'Maria',
            'middle_name' => null,
            'last_name' => 'Santos',
        ]);

        foreach ([$keeper, $duplicate] as $student) {
            StudentSchoolYearRecord::factory()->create([
                'library_member_id' => $student->id,
                'school_year_id' => $schoolYear->id,
                'year_level' => 'Grade 5',
                'section' => 'Rizal',
            ]);
        }

        $visit = LibraryVisit::factory()->create([
            'library_member_id' => $duplicate->id,
            'school_year_id' => $schoolYear->id,
        ]);

        $payload = [
            'rfid_uid' => '1000000999',
            'school_id' => '',
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Maria',
            'middle_name' => '',
            'last_name' => 'Santos',
            'year_level' => 'Grade 5',
            'section' => 'Rizal',
        ];

        $this->actingAs($admin)->put("/admin/registered-visitors/{$keeper->id}", $payload)
            ->assertSessionHasErrors('confirm_merge_duplicates');

        $this->assertNull($keeper->refresh()->rfid_uid);
        $this->assertDatabaseHas('library_members', ['id' => $duplicate->id]);

        $this->actingAs($admin)->put("/admin/registered-visitors/{$keeper->id}", $payload + [
            'confirm_merge_duplicates' => true,
        ])->assertRedirect('/admin/registered-visitors?type=student');

        $this->assertSame('1000000999', $keeper->refresh()->rfid_uid);
        $this->assertDatabaseMissing('library_members', ['id' => $duplicate->id]);
        $this->assertDatabaseHas('library_visits', [
            'id' => $visit->id,
            'library_member_id' => $keeper->id,
        ]);
    }

    public function test_non_admin_can_not_access_registered_visitor_management(): void
    {
        $user = User::factory()->create(['role' => 'librarian']);

        $this->actingAs($user)->get('/admin/registered-visitors')->assertForbidden();
    }

    private function fakeJpegUpload(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'visitor-photo');

        file_put_contents($path, base64_decode('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGAf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8BP//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8BP//Z'));

        return new UploadedFile($path, 'maria.jpg', 'image/jpeg', null, true);
    }
}

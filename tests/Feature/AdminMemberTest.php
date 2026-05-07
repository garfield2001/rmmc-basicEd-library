<?php

namespace Tests\Feature;

use App\Models\LibraryMember;
use App\Models\SchoolYear;
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
            'photo_file' => UploadedFile::fake()->image('maria.jpg'),
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

    public function test_non_admin_can_not_access_member_management(): void
    {
        $user = User::factory()->create(['role' => 'librarian']);

        $this->actingAs($user)->get('/admin/members')->assertForbidden();
    }
}

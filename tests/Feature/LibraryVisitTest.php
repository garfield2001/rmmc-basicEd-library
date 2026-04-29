<?php

namespace Tests\Feature;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LibraryVisitTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_record_visit_from_rfid(): void
    {
        $user = User::factory()->create();

        $schoolYear = SchoolYear::create([
            'name' => '2026-2027',
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
            'minimum_visits' => 3,
            'target_visits' => 4,
            'is_active' => true,
        ]);

        $member = LibraryMember::create([
            'rfid_uid' => '100001',
            'school_id' => 'STU-001',
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Maria',
            'last_name' => 'Santos',
            'grade_level' => 'Grade 10',
            'section' => 'A',
        ]);

        $response = $this->actingAs($user)->post('/library-visits', [
            'rfid_uid' => '100001',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('library_visits', [
            'library_member_id' => $member->id,
            'school_year_id' => $schoolYear->id,
        ]);
    }

    public function test_guest_can_record_visit_from_rfid(): void
    {
        $schoolYear = SchoolYear::create([
            'name' => '2026-2027',
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
            'minimum_visits' => 3,
            'target_visits' => 4,
            'is_active' => true,
        ]);

        $member = LibraryMember::create([
            'rfid_uid' => '100001',
            'school_id' => 'STU-001',
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Maria',
            'last_name' => 'Santos',
        ]);

        $this->post('/library-visits', [
            'rfid_uid' => '100001',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('library_visits', [
            'library_member_id' => $member->id,
            'school_year_id' => $schoolYear->id,
        ]);
    }
}

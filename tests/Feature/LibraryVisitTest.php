<?php

namespace Tests\Feature;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class LibraryVisitTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_record_visit_from_card(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 08:00:00', config('app.timezone')));

        $user = User::factory()->create();
        $schoolYear = $this->createActiveSchoolYear();
        $member = $this->createMember();

        $response = $this->actingAs($user)->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('recentVisit');
        $response->assertSessionMissing('success');
        $this->assertDatabaseHas('library_visits', [
            'library_member_id' => $member->id,
            'school_year_id' => $schoolYear->id,
        ]);
    }

    public function test_guest_can_record_visit_from_card(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 08:00:00', config('app.timezone')));

        $schoolYear = $this->createActiveSchoolYear();
        $member = $this->createMember();

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('library_visits', [
            'library_member_id' => $member->id,
            'school_year_id' => $schoolYear->id,
        ]);
    }

    public function test_guest_can_record_visit_from_school_id(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 08:00:00', config('app.timezone')));

        $this->createActiveSchoolYear();
        $member = $this->createMember();

        $this->post('/library-visits', [
            'rfid_uid' => 'STU-001',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('library_visits', [
            'library_member_id' => $member->id,
        ]);
    }

    public function test_guest_can_record_visit_from_full_name(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 08:00:00', config('app.timezone')));

        $this->createActiveSchoolYear();
        $member = $this->createMember();

        $this->post('/library-visits', [
            'rfid_uid' => 'Maria Santos',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('library_visits', [
            'library_member_id' => $member->id,
        ]);
    }

    public function test_guest_can_record_visit_from_unique_last_name(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 08:00:00', config('app.timezone')));

        $this->createActiveSchoolYear();
        $member = $this->createMember();

        $this->post('/library-visits', [
            'rfid_uid' => 'Santos',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('library_visits', [
            'library_member_id' => $member->id,
        ]);
    }

    public function test_ambiguous_member_lookup_is_rejected(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 08:00:00', config('app.timezone')));

        $this->createActiveSchoolYear();
        $this->createMember();
        LibraryMember::create([
            'rfid_uid' => '1000000002',
            'school_id' => 'STU-002',
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Ana',
            'last_name' => 'Santos',
        ]);

        $this->post('/library-visits', [
            'rfid_uid' => 'Santos',
        ])->assertSessionHasErrors('rfid_uid');

        $this->assertSame(0, LibraryVisit::count());
    }

    public function test_member_cannot_revisit_within_one_hour(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 08:30:00', config('app.timezone')));

        $schoolYear = $this->createActiveSchoolYear();
        $member = $this->createMember();

        LibraryVisit::create([
            'library_member_id' => $member->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => now()->subMinutes(30),
        ]);

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasErrors([
            'rfid_uid' => 'This ID was already scanned at 8:00 AM. A new visit can be recorded after 9:00 AM because repeat scans are limited to once per hour.',
        ]);

        $this->assertSame(1, LibraryVisit::count());
    }

    public function test_member_can_revisit_after_one_hour(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 09:00:00', config('app.timezone')));

        $schoolYear = $this->createActiveSchoolYear();
        $member = $this->createMember();

        LibraryVisit::create([
            'library_member_id' => $member->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => now()->subHour(),
        ]);

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasNoErrors();

        $this->assertSame(2, LibraryVisit::count());
    }

    public function test_scan_is_allowed_before_seven_am_for_temporary_twenty_four_hour_access(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 06:59:00', config('app.timezone')));

        $this->createActiveSchoolYear();
        $this->createMember();

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasNoErrors();

        $this->assertSame(1, LibraryVisit::count());
    }

    public function test_scan_is_allowed_late_at_night_for_temporary_twenty_four_hour_access(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 23:30:00', config('app.timezone')));

        $this->createActiveSchoolYear();
        $this->createMember();

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasNoErrors();

        $this->assertSame(1, LibraryVisit::count());
    }

    private function createActiveSchoolYear(): SchoolYear
    {
        return SchoolYear::create([
            'name' => '2026-2027',
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
            'minimum_visits' => 3,
            'target_visits' => 4,
            'is_active' => true,
        ]);
    }

    private function createMember(): LibraryMember
    {
        return LibraryMember::create([
            'rfid_uid' => '1000000001',
            'school_id' => 'STU-001',
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Maria',
            'last_name' => 'Santos',
        ]);
    }
}

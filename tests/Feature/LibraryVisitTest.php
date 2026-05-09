<?php

namespace Tests\Feature;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\StudentEnrollment;
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
        $otherMember = LibraryMember::create([
            'rfid_uid' => '1000000002',
            'school_id' => 'STU-002',
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Ana',
            'last_name' => 'Santos',
        ]);
        $this->enrollMemberForActiveSchoolYear($otherMember);

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
        ])->assertSessionHasErrors('rfid_uid');

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

    public function test_admin_configured_repeat_scan_interval_is_enforced(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 10:00:00', config('app.timezone')));

        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = $this->createActiveSchoolYear();
        $member = $this->createMember();

        $this->actingAs($admin)->patch('/admin/scan-settings', [
            'repeat_scan_interval_hours' => 2,
            'scan_starts_at' => '08:00',
            'scan_ends_at' => '17:00',
        ])->assertSessionHasNoErrors();

        LibraryVisit::create([
            'library_member_id' => $member->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => now()->subMinutes(90),
        ]);

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasErrors('rfid_uid');

        $this->assertSame(1, LibraryVisit::count());
    }

    public function test_student_without_active_school_year_enrollment_cannot_scan(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 08:00:00', config('app.timezone')));

        $oldSchoolYear = SchoolYear::create([
            'name' => '2025-2026',
            'starts_at' => '2025-06-01',
            'ends_at' => '2026-03-31',
            'minimum_visits' => 3,
            'target_visits' => 4,
            'is_active' => false,
        ]);
        $this->createActiveSchoolYear();
        $member = LibraryMember::create([
            'rfid_uid' => '1000000001',
            'school_id' => 'STU-001',
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Maria',
            'last_name' => 'Santos',
        ]);

        StudentEnrollment::create([
            'library_member_id' => $member->id,
            'school_year_id' => $oldSchoolYear->id,
            'year_level' => 'Grade 1',
            'section' => 'Rizal',
        ]);

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasErrors('rfid_uid');

        $this->assertSame(0, LibraryVisit::count());
    }

    public function test_student_carried_forward_to_new_school_year_can_scan_and_history_stays_separate(): void
    {
        $this->travelTo(Carbon::parse('2027-06-15 09:00:00', config('app.timezone')));

        $oldSchoolYear = SchoolYear::create([
            'name' => '2026-2027',
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
            'minimum_visits' => 3,
            'target_visits' => 4,
            'is_active' => false,
        ]);
        $newSchoolYear = SchoolYear::create([
            'name' => '2027-2028',
            'starts_at' => '2027-06-01',
            'ends_at' => '2028-03-31',
            'minimum_visits' => 3,
            'target_visits' => 4,
            'is_active' => true,
        ]);
        $member = LibraryMember::create([
            'rfid_uid' => '1000000001',
            'school_id' => 'STU-001',
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Juan',
            'last_name' => 'Santos',
        ]);

        StudentEnrollment::create([
            'library_member_id' => $member->id,
            'school_year_id' => $oldSchoolYear->id,
            'year_level' => 'Grade 10',
            'section' => 'Rizal',
        ]);
        StudentEnrollment::create([
            'library_member_id' => $member->id,
            'school_year_id' => $newSchoolYear->id,
            'year_level' => 'Grade 10',
            'section' => null,
        ]);
        LibraryVisit::create([
            'library_member_id' => $member->id,
            'school_year_id' => $oldSchoolYear->id,
            'visited_at' => Carbon::parse('2026-09-01 08:00:00', config('app.timezone')),
        ]);

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('library_visits', [
            'library_member_id' => $member->id,
            'school_year_id' => $oldSchoolYear->id,
        ]);
        $this->assertDatabaseHas('library_visits', [
            'library_member_id' => $member->id,
            'school_year_id' => $newSchoolYear->id,
        ]);
    }

    public function test_soft_deleted_member_keeps_historical_visits(): void
    {
        $schoolYear = $this->createActiveSchoolYear();
        $member = $this->createMember();
        $visit = LibraryVisit::create([
            'library_member_id' => $member->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => now(),
        ]);

        $member->delete();

        $this->assertSoftDeleted('library_members', ['id' => $member->id]);
        $this->assertDatabaseHas('library_visits', ['id' => $visit->id]);
        $this->assertSame($member->id, $visit->fresh()->member?->id);
    }

    public function test_scan_before_window_is_rejected(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 06:59:00', config('app.timezone')));

        $this->createActiveSchoolYear();
        $this->createMember();

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasErrors('rfid_uid');

        $this->assertSame(0, LibraryVisit::count());
    }

    public function test_scan_after_window_is_rejected(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 23:30:00', config('app.timezone')));

        $this->createActiveSchoolYear();
        $this->createMember();

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasErrors('rfid_uid');

        $this->assertSame(0, LibraryVisit::count());
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
        $member = LibraryMember::create([
            'rfid_uid' => '1000000001',
            'school_id' => 'STU-001',
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Maria',
            'last_name' => 'Santos',
        ]);

        $this->enrollMemberForActiveSchoolYear($member);

        return $member;
    }

    private function enrollMemberForActiveSchoolYear(LibraryMember $member): void
    {
        $schoolYear = SchoolYear::active()->firstOrFail();

        StudentEnrollment::create([
            'library_member_id' => $member->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 1',
            'section' => 'Rizal',
        ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\StudentSchoolYearRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LibraryVisitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    public function test_authenticated_user_can_record_visit_from_card(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 08:00:00', config('app.timezone')));

        $user = User::factory()->create();
        $schoolYear = $this->createActiveSchoolYear();
        $visitor = $this->createVisitor();

        $response = $this->actingAs($user)->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('recentVisit');
        $response->assertSessionMissing('success');
        $this->assertDatabaseHas('library_visits', [
            'library_member_id' => $visitor->id,
            'school_year_id' => $schoolYear->id,
        ]);
    }

    public function test_guest_can_record_visit_from_card(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 08:00:00', config('app.timezone')));

        $schoolYear = $this->createActiveSchoolYear();
        $visitor = $this->createVisitor();

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('library_visits', [
            'library_member_id' => $visitor->id,
            'school_year_id' => $schoolYear->id,
        ]);
    }

    public function test_guest_can_record_visit_from_school_id(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 08:00:00', config('app.timezone')));

        $this->createActiveSchoolYear();
        $visitor = $this->createVisitor();

        $this->post('/library-visits', [
            'rfid_uid' => 'STU-001',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('library_visits', [
            'library_member_id' => $visitor->id,
        ]);
    }

    public function test_guest_can_record_visit_from_name_when_visitor_has_rfid(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 08:00:00', config('app.timezone')));

        $this->createActiveSchoolYear();
        $visitor = $this->createVisitor();

        $this->post('/library-visits', [
            'rfid_uid' => 'Maria Santos',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('library_visits', [
            'library_member_id' => $visitor->id,
        ]);
    }

    public function test_school_id_or_name_lookup_cannot_record_visit_without_rfid(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 08:00:00', config('app.timezone')));

        $this->createActiveSchoolYear();
        $visitor = LibraryMember::create([
            'rfid_uid' => null,
            'school_id' => 'STU-002',
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Ana',
            'last_name' => 'Reyes',
        ]);
        $this->registerVisitorForActiveSchoolYear($visitor);

        $this->post('/library-visits', [
            'rfid_uid' => 'STU-002',
        ])->assertSessionHasErrors('rfid_uid');

        $this->post('/library-visits', [
            'rfid_uid' => 'Ana Reyes',
        ])->assertSessionHasErrors('rfid_uid');

        $this->assertSame(0, LibraryVisit::count());
    }

    public function test_registered_visitor_cannot_revisit_within_one_hour(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 08:30:00', config('app.timezone')));

        $schoolYear = $this->createActiveSchoolYear();
        $visitor = $this->createVisitor();

        LibraryVisit::create([
            'library_member_id' => $visitor->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => now()->subMinutes(30),
        ]);

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasErrors('rfid_uid');

        $this->assertSame(1, LibraryVisit::count());
    }

    public function test_registered_visitor_can_revisit_after_one_hour(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 09:00:00', config('app.timezone')));

        $schoolYear = $this->createActiveSchoolYear();
        $visitor = $this->createVisitor();

        LibraryVisit::create([
            'library_member_id' => $visitor->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => now()->subHour(),
        ]);

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasNoErrors();

        $this->assertSame(2, LibraryVisit::count());
    }

    public function test_app_configured_repeat_scan_interval_is_enforced(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 10:00:00', config('app.timezone')));
        Config::set('library.scan.repeat_scan_interval_hours', 2);
        Config::set('library.scan.starts_at', '08:00');
        Config::set('library.scan.ends_at', '17:00');

        $schoolYear = $this->createActiveSchoolYear();
        $visitor = $this->createVisitor();

        LibraryVisit::create([
            'library_member_id' => $visitor->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => now()->subMinutes(90),
        ]);

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasErrors('rfid_uid');

        $this->assertSame(1, LibraryVisit::count());
    }

    public function test_student_without_active_school_year_record_cannot_scan(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 08:00:00', config('app.timezone')));

        $oldSchoolYear = SchoolYear::create([
            'name' => '2025-2026',
            'starts_at' => '2025-06-01',
            'ends_at' => '2026-03-31',
            'student_required_visits' => 3,
            'employee_required_visits' => 4,
            'is_active' => false,
        ]);
        $this->createActiveSchoolYear();
        $visitor = LibraryMember::create([
            'rfid_uid' => '1000000001',
            'school_id' => 'STU-001',
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Maria',
            'last_name' => 'Santos',
        ]);

        StudentSchoolYearRecord::create([
            'library_member_id' => $visitor->id,
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
            'student_required_visits' => 3,
            'employee_required_visits' => 4,
            'is_active' => false,
        ]);
        $newSchoolYear = SchoolYear::create([
            'name' => '2027-2028',
            'starts_at' => '2027-06-01',
            'ends_at' => '2028-03-31',
            'student_required_visits' => 3,
            'employee_required_visits' => 4,
            'is_active' => true,
        ]);
        $visitor = LibraryMember::create([
            'rfid_uid' => '1000000001',
            'school_id' => 'STU-001',
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Juan',
            'last_name' => 'Santos',
        ]);

        StudentSchoolYearRecord::create([
            'library_member_id' => $visitor->id,
            'school_year_id' => $oldSchoolYear->id,
            'year_level' => 'Grade 10',
            'section' => 'Rizal',
        ]);
        StudentSchoolYearRecord::create([
            'library_member_id' => $visitor->id,
            'school_year_id' => $newSchoolYear->id,
            'year_level' => 'Grade 10',
            'section' => null,
        ]);
        LibraryVisit::create([
            'library_member_id' => $visitor->id,
            'school_year_id' => $oldSchoolYear->id,
            'visited_at' => Carbon::parse('2026-09-01 08:00:00', config('app.timezone')),
        ]);

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('library_visits', [
            'library_member_id' => $visitor->id,
            'school_year_id' => $oldSchoolYear->id,
        ]);
        $this->assertDatabaseHas('library_visits', [
            'library_member_id' => $visitor->id,
            'school_year_id' => $newSchoolYear->id,
        ]);
    }

    public function test_scan_before_window_is_rejected(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 06:59:00', config('app.timezone')));

        $this->setScanWindow('08:00', '17:00');
        $this->createActiveSchoolYear();
        $this->createVisitor();

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasErrors('rfid_uid');

        $this->assertSame(0, LibraryVisit::count());
    }

    public function test_scan_after_window_is_rejected(): void
    {
        $this->travelTo(Carbon::parse('2026-09-01 23:30:00', config('app.timezone')));

        $this->setScanWindow('08:00', '17:00');
        $this->createActiveSchoolYear();
        $this->createVisitor();

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasErrors('rfid_uid');

        $this->assertSame(0, LibraryVisit::count());
    }

    public function test_scan_before_active_school_year_start_is_rejected(): void
    {
        $this->travelTo(Carbon::parse('2026-04-30 08:00:00', config('app.timezone')));

        $this->createActiveSchoolYear();
        $this->createVisitor();

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasErrors('rfid_uid');

        $this->assertSame(0, LibraryVisit::count());
    }

    public function test_scan_after_active_school_year_end_is_rejected(): void
    {
        $this->travelTo(Carbon::parse('2027-03-08 08:00:00', config('app.timezone')));

        $this->createActiveSchoolYear();
        $this->createVisitor();

        $this->post('/library-visits', [
            'rfid_uid' => '1000000001',
        ])->assertSessionHasErrors('rfid_uid');

        $this->assertSame(0, LibraryVisit::count());
    }

    private function createActiveSchoolYear(): SchoolYear
    {
        return SchoolYear::create([
            'name' => '2026-2027',
            'starts_at' => '2026-05-01',
            'ends_at' => '2027-03-07',
            'student_required_visits' => 3,
            'employee_required_visits' => 4,
            'is_active' => true,
        ]);
    }

    private function createVisitor(): LibraryMember
    {
        $visitor = LibraryMember::create([
            'rfid_uid' => '1000000001',
            'school_id' => 'STU-001',
            'type' => LibraryMember::TYPE_STUDENT,
            'first_name' => 'Maria',
            'last_name' => 'Santos',
        ]);

        $this->registerVisitorForActiveSchoolYear($visitor);

        return $visitor;
    }

    private function registerVisitorForActiveSchoolYear(LibraryMember $visitor): void
    {
        $schoolYear = SchoolYear::active()->firstOrFail();

        StudentSchoolYearRecord::create([
            'library_member_id' => $visitor->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 1',
            'section' => 'Rizal',
        ]);
    }

    private function setScanWindow(string $startsAt, string $endsAt): void
    {
        Config::set('library.scan.repeat_scan_interval_minutes', 60);
        Config::set('library.scan.starts_at', $startsAt);
        Config::set('library.scan.ends_at', $endsAt);
    }
}

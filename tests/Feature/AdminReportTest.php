<?php

namespace Tests\Feature;

use App\Models\EmployeeProfile;
use App\Models\RegisteredVisitor;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\StudentSchoolYearRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_requires_login(): void
    {
        $this->get('/admin')->assertRedirect('/');
    }

    public function test_authenticated_user_can_view_admin_dashboard(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/dashboard')
                ->has('dashboard')
                ->missing('visitMonitor')
                ->missing('publicDashboard'));
    }

    public function test_authenticated_user_can_view_live_visits(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get('/admin/live-visits')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/live-visits')
                ->has('visitMonitor')
                ->where('visitMonitor.scanTargets', [])
                ->missing('dashboard'));
    }

    public function test_admin_can_search_limited_live_visit_scan_targets(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create();

        RegisteredVisitor::factory()
            ->student()
            ->count(12)
            ->create(['last_name' => 'Santos'])
            ->each(function (RegisteredVisitor $member) use ($schoolYear): void {
                StudentSchoolYearRecord::factory()->create([
                    'registered_visitor_id' => $member->id,
                    'school_year_id' => $schoolYear->id,
                    'year_level' => 'Grade 5',
                    'section' => 'Rizal',
                ]);
            });

        $this->actingAs($admin)->getJson('/admin/live-visits/scan-targets?search=Santos')
            ->assertOk()
            ->assertJsonCount(8, 'targets')
            ->assertJsonPath('targets.0.type', RegisteredVisitor::TYPE_STUDENT);
    }

    public function test_authenticated_user_can_view_settings(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get('/admin/settings')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/settings')
                ->where('scanSettings.repeat_scan_interval_hours', 1)
                ->where('scanSettings.scan_starts_at', '00:00')
                ->where('scanSettings.scan_ends_at', '23:59'));
    }

    public function test_authenticated_user_can_export_visit_report_csv(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::create([
            'name' => '2026-2027',
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
            'is_active' => true,
        ]);
        $member = RegisteredVisitor::create([
            'rfid_uid' => '300001',
            'school_id' => 'EMP-001',
            'type' => RegisteredVisitor::TYPE_EMPLOYEE,
            'first_name' => 'Ana',
            'last_name' => 'Reyes',
        ]);
        EmployeeProfile::create([
            'registered_visitor_id' => $member->id,
            'department' => 'Faculty',
        ]);

        LibraryVisit::create([
            'registered_visitor_id' => $member->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => now(),
        ]);

        $response = $this->actingAs($user)->get('/admin/reports/visits.csv');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }

    public function test_report_progress_keeps_students_and_Employees_separate(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create([
            'name' => '2026-2027',
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
            'minimum_visits' => 2,
            'target_visits' => 3,
        ]);
        $student = RegisteredVisitor::factory()->student()->create([
            'school_id' => 'STU-001',
            'first_name' => 'Ben',
            'last_name' => 'Santos',
        ]);
        $employee = RegisteredVisitor::factory()->employee()->create([
            'school_id' => 'EMP-001',
            'first_name' => 'Ana',
            'last_name' => 'Reyes',
        ]);

        StudentSchoolYearRecord::factory()->create([
            'registered_visitor_id' => $student->id,
            'school_year_id' => $schoolYear->id,
            'year_level' => 'Grade 5',
            'section' => 'Rizal',
        ]);
        EmployeeProfile::factory()->create([
            'registered_visitor_id' => $employee->id,
            'department' => 'Faculty',
        ]);
        LibraryVisit::factory()->count(2)->create([
            'registered_visitor_id' => $student->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => '2026-08-01 09:00:00',
        ]);
        LibraryVisit::factory()->create([
            'registered_visitor_id' => $employee->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => '2026-08-01 10:00:00',
        ]);

        $this->actingAs($admin)
            ->get("/admin/reports?school_year_id={$schoolYear->id}&start_date=2026-06-01&end_date=2027-03-31&member_type=student")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/reports')
                ->where('report.summary.member_type', 'student')
                ->where('report.summary.members', 1)
                ->where('report.summary.total_visits', 2)
                ->where('report.summary.met_minimum', 1)
                ->where('report.rows.0.type', RegisteredVisitor::TYPE_STUDENT)
                ->where('report.rows.0.school_id', 'STU-001')
                ->where('report.rows.0.visit_count', 2));

        $this->actingAs($admin)
            ->get("/admin/reports?school_year_id={$schoolYear->id}&start_date=2026-06-01&end_date=2027-03-31&member_type=employee")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('report.summary.member_type', 'employee')
                ->where('report.summary.members', 1)
                ->where('report.summary.total_visits', 1)
                ->where('report.rows.0.type', RegisteredVisitor::TYPE_EMPLOYEE)
                ->where('report.rows.0.school_id', 'EMP-001')
                ->where('report.rows.0.visit_count', 1));
    }

    public function test_report_dates_must_stay_inside_selected_school_year(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create([
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
        ]);

        $this->actingAs($admin)
            ->from('/admin/reports')
            ->get("/admin/reports?school_year_id={$schoolYear->id}&start_date=2026-05-31&end_date=2027-03-31&member_type=student")
            ->assertRedirect('/admin/reports')
            ->assertSessionHasErrors('start_date');

        $this->actingAs($admin)
            ->from('/admin/reports')
            ->get("/admin/reports?school_year_id={$schoolYear->id}&start_date=2026-06-01&end_date=2027-04-01&member_type=student")
            ->assertRedirect('/admin/reports')
            ->assertSessionHasErrors('end_date');
    }

    public function test_report_sends_school_year_dates_without_timezone_shift(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $schoolYear = SchoolYear::factory()->active()->create([
            'name' => '2026-2027',
            'starts_at' => '2026-06-01',
            'ends_at' => '2027-03-31',
        ]);

        $this->actingAs($admin)
            ->get("/admin/reports?school_year_id={$schoolYear->id}&member_type=student")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('report.school_year.starts_at', '2026-06-01')
                ->where('report.school_year.ends_at', '2027-03-31')
                ->where('reportOptions.schoolYears.0.starts_at', '2026-06-01')
                ->where('reportOptions.schoolYears.0.ends_at', '2027-03-31'));
    }
}

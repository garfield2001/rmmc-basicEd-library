<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\StudentEnrollment;
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

        LibraryMember::factory()
            ->student()
            ->count(12)
            ->create(['last_name' => 'Santos'])
            ->each(function (LibraryMember $member) use ($schoolYear): void {
                StudentEnrollment::factory()->create([
                    'library_member_id' => $member->id,
                    'school_year_id' => $schoolYear->id,
                    'year_level' => 'Grade 5',
                    'section' => 'Rizal',
                ]);
            });

        $this->actingAs($admin)->getJson('/admin/live-visits/scan-targets?search=Santos')
            ->assertOk()
            ->assertJsonCount(8, 'targets')
            ->assertJsonPath('targets.0.type', LibraryMember::TYPE_STUDENT);
    }

    public function test_authenticated_user_can_view_settings(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get('/admin/settings')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/settings'));
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
        $member = LibraryMember::create([
            'rfid_uid' => '300001',
            'school_id' => 'EMP-001',
            'type' => LibraryMember::TYPE_EMPLOYEE,
            'first_name' => 'Ana',
            'last_name' => 'Reyes',
        ]);
        Employee::create([
            'library_member_id' => $member->id,
            'department' => 'Faculty',
        ]);

        LibraryVisit::create([
            'library_member_id' => $member->id,
            'school_year_id' => $schoolYear->id,
            'visited_at' => now(),
        ]);

        $response = $this->actingAs($user)->get('/admin/reports/visits.csv');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }
}

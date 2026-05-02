<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\LibraryMember;
use App\Models\LibraryVisit;
use App\Models\SchoolYear;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_requires_login(): void
    {
        $this->get('/admin')->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_admin_dashboard(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/dashboard')
                ->has('dashboard')
                ->has('visitMonitor')
                ->missing('publicDashboard'));
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

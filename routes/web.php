<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminProfileController;
use App\Http\Controllers\AdminSchoolYearController;
use App\Http\Controllers\AdminSettingsController;
use App\Http\Controllers\AdminVisitMonitorController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LibraryMemberController;
use App\Http\Controllers\LibraryVisitController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::middleware('guest')->group(function () {
    Route::get('login', fn () => redirect('/?login=1'))->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::post('session/close', [AuthenticatedSessionController::class, 'destroyOnClose'])->name('session.close');
});

Route::post('library-visits', [LibraryVisitController::class, 'store'])->name('library-visits.store');

Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('admin', AdminDashboardController::class)->name('admin.dashboard');
    Route::get('admin/live-visits', AdminVisitMonitorController::class)->name('admin.live-visits');
    Route::get('admin/settings', AdminSettingsController::class)->name('admin.settings');
    Route::patch('admin/profile', [AdminProfileController::class, 'update'])->name('admin.profile.update');
    Route::post('admin/school-years', [AdminSchoolYearController::class, 'store'])->name('admin.school-years.store');
    Route::patch('admin/school-years/{schoolYear}/activate', [AdminSchoolYearController::class, 'activate'])->name('admin.school-years.activate');

    Route::post('admin/members/preview-student-assignment', [LibraryMemberController::class, 'previewStudentAssignment'])->name('admin.members.preview-student-assignment');
    Route::patch('admin/members/bulk-assign-students', [LibraryMemberController::class, 'bulkAssignStudents'])->name('admin.members.bulk-assign-students');
    Route::resource('admin/members', LibraryMemberController::class)->except('show')->names('admin.members');

    Route::get('admin/reports', [ReportController::class, 'index'])->name('admin.reports');
    Route::get('admin/reports/visits.csv', [ReportController::class, 'exportCsv'])->name('admin.reports.visits.csv');
    Route::get('admin/reports/visits.xls', [ReportController::class, 'exportExcel'])->name('admin.reports.visits.xls');
    Route::get('admin/reports/visits.doc', [ReportController::class, 'exportWord'])->name('admin.reports.visits.doc');
    Route::get('admin/reports/visits/print', [ReportController::class, 'print'])->name('admin.reports.visits.print');
});

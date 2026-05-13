<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminProfileController;
use App\Http\Controllers\AdminScanSettingsController;
use App\Http\Controllers\AdminSchoolYearController;
use App\Http\Controllers\AdminSettingsController;
use App\Http\Controllers\AdminVisitMonitorController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\RegisteredVisitorController;
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
    Route::get('admin/live-visits/scan-targets', [AdminVisitMonitorController::class, 'scanTargets'])->name('admin.live-visits.scan-targets');
    Route::get('admin/live-visits', AdminVisitMonitorController::class)->name('admin.live-visits');
    Route::get('admin/settings', AdminSettingsController::class)->name('admin.settings');
    Route::patch('admin/profile', [AdminProfileController::class, 'update'])->name('admin.profile.update');
    Route::patch('admin/scan-settings', [AdminScanSettingsController::class, 'update'])->name('admin.scan-settings.update');
    Route::post('admin/school-years', [AdminSchoolYearController::class, 'store'])->name('admin.school-years.store');
    Route::patch('admin/school-years/{schoolYear}', [AdminSchoolYearController::class, 'update'])->name('admin.school-years.update');
    Route::patch('admin/school-years/{schoolYear}/activate', [AdminSchoolYearController::class, 'activate'])->name('admin.school-years.activate');

    Route::post('admin/registered-visitors/preview-student-assignment', [RegisteredVisitorController::class, 'previewStudentAssignment'])->name('admin.registered-visitors.preview-student-assignment');
    Route::patch('admin/registered-visitors/bulk-assign-students', [RegisteredVisitorController::class, 'bulkAssignStudents'])->name('admin.registered-visitors.bulk-assign-students');
    Route::delete('admin/registered-visitors/bulk', [RegisteredVisitorController::class, 'bulkDestroy'])->name('admin.registered-visitors.bulk-destroy');
    Route::post('admin/registered-visitors/copy-columns', [RegisteredVisitorController::class, 'copyColumns'])->name('admin.registered-visitors.copy-columns');
    Route::post('admin/registered-visitors/import', [RegisteredVisitorController::class, 'import'])->name('admin.registered-visitors.import');
    Route::get('admin/registered-visitors/archive', [RegisteredVisitorController::class, 'archive'])->name('admin.registered-visitors.archive');
    Route::get('admin/registered-visitors/archive/export', [RegisteredVisitorController::class, 'exportArchived'])->name('admin.registered-visitors.archive.export');
    Route::delete('admin/registered-visitors/archive/bulk', [RegisteredVisitorController::class, 'bulkPermanentlyDeleteArchived'])->name('admin.registered-visitors.archive.bulk-destroy');
    Route::patch('admin/registered-visitors/archive/{member}/restore', [RegisteredVisitorController::class, 'restoreArchived'])->name('admin.registered-visitors.archive.restore');
    Route::delete('admin/registered-visitors/archive/{member}', [RegisteredVisitorController::class, 'permanentlyDeleteArchived'])->name('admin.registered-visitors.archive.destroy');
    Route::resource('admin/registered-visitors', RegisteredVisitorController::class)->except('show')->names('admin.registered-visitors');

    Route::get('admin/reports', [ReportController::class, 'index'])->name('admin.reports');
    Route::get('admin/reports/visits.csv', [ReportController::class, 'exportCsv'])->name('admin.reports.visits.csv');
    Route::get('admin/reports/visits.xls', [ReportController::class, 'exportExcel'])->name('admin.reports.visits.xls');
    Route::get('admin/reports/visits.doc', [ReportController::class, 'exportWord'])->name('admin.reports.visits.doc');
    Route::get('admin/reports/visits/print', [ReportController::class, 'print'])->name('admin.reports.visits.print');
});

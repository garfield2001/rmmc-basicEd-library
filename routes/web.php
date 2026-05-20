<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminProfileController;
use App\Http\Controllers\AdminScanSettingsController;
use App\Http\Controllers\AdminSchoolYearController;
use App\Http\Controllers\AdminSettingsController;
use App\Http\Controllers\AdminVisitHistoryController;
use App\Http\Controllers\AdminVisitMonitorController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LibraryMemberController;
use App\Http\Controllers\LibraryVisitController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'show'])->name('login');
    Route::post('login', [LoginController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::get('session/status', [LoginController::class, 'status'])->name('session.status');
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');
    Route::post('session/close', [LoginController::class, 'destroyOnClose'])->name('session.close');
});

Route::post('library-visits', [LibraryVisitController::class, 'store'])->name('library-visits.store');

Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('admin', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('admin/live-visits/scan-targets', [AdminVisitMonitorController::class, 'scanTargets'])->name('admin.live-visits.scan-targets');
    Route::get('admin/live-visits', [AdminVisitMonitorController::class, 'index'])->name('admin.live-visits');
    Route::get('admin/visits-history', [AdminVisitHistoryController::class, 'index'])->name('admin.visits-history');
    Route::get('admin/settings', [AdminSettingsController::class, 'index'])->name('admin.settings');
    Route::patch('admin/profile', [AdminProfileController::class, 'update'])->name('admin.profile.update');
    Route::patch('admin/scan-settings', [AdminScanSettingsController::class, 'update'])->name('admin.scan-settings.update');
    Route::post('admin/school-years', [AdminSchoolYearController::class, 'store'])->name('admin.school-years.store');
    Route::patch('admin/school-years/{schoolYear}', [AdminSchoolYearController::class, 'update'])->name('admin.school-years.update');
    Route::patch('admin/school-years/{schoolYear}/activate', [AdminSchoolYearController::class, 'activate'])->name('admin.school-years.activate');

    Route::post('admin/registered-visitors/import/preview', [LibraryMemberController::class, 'importPreview'])->name('admin.registered-visitors.import.preview');
    Route::post('admin/registered-visitors/import', [LibraryMemberController::class, 'import'])->name('admin.registered-visitors.import');
    Route::resource('admin/registered-visitors', LibraryMemberController::class)->except(['show', 'destroy'])->names('admin.registered-visitors');

    Route::get('admin/reports', [ReportController::class, 'index'])->name('admin.reports');
    Route::get('admin/reports/visits.csv', [ReportController::class, 'exportCsv'])->name('admin.reports.visits.csv');
    Route::get('admin/reports/visits.xlsx', [ReportController::class, 'exportExcel'])->name('admin.reports.visits.xlsx');
    Route::get('admin/reports/visits.xls', [ReportController::class, 'exportExcel'])->name('admin.reports.visits.xls');
    Route::get('admin/reports/visits.docx', [ReportController::class, 'exportWord'])->name('admin.reports.visits.docx');
    Route::get('admin/reports/visits.doc', [ReportController::class, 'exportWord'])->name('admin.reports.visits.doc');
    Route::get('admin/reports/visits.pdf', [ReportController::class, 'exportPdf'])->name('admin.reports.visits.pdf');
    Route::get('admin/reports/visits/print', [ReportController::class, 'print'])->name('admin.reports.visits.print');
});

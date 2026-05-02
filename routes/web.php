<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminProfileController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\LibraryMemberController;
use App\Http\Controllers\LibraryVisitController;
use App\Http\Controllers\PublicHomeController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::get('/', PublicHomeController::class)->name('index');

Route::middleware('guest')->group(function () {
    Route::get('login', fn () => redirect()->route('index', ['login' => 1]))->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::post('session/close', [AuthenticatedSessionController::class, 'destroyOnClose'])->name('session.close');
});

Route::post('library-visits', [LibraryVisitController::class, 'store'])->name('library-visits.store');

Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('admin', AdminDashboardController::class)->name('admin.dashboard');
    Route::patch('admin/profile', [AdminProfileController::class, 'update'])->name('admin.profile.update');
    Route::resource('admin/members', LibraryMemberController::class)->except('show')->names('admin.members');
    Route::get('admin/reports', [ReportController::class, 'index'])->name('admin.reports');
    Route::get('admin/reports/visits.csv', [ReportController::class, 'exportCsv'])->name('admin.reports.visits.csv');
    Route::get('admin/reports/visits/print', [ReportController::class, 'print'])->name('admin.reports.visits.print');
});

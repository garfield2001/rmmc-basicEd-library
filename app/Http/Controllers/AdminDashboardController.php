<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\AdminDashboardService;
use App\Services\Dashboard\AdminVisitMonitorService;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(AdminDashboardService $dashboard, AdminVisitMonitorService $visitMonitor): Response
    {
        return Inertia::render('admin/dashboard', [
            'dashboard' => $dashboard->getData(),
            'visitMonitor' => $visitMonitor->getData(),
        ]);
    }
}

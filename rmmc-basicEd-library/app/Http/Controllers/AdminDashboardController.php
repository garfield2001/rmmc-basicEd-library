<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\AdminDashboardService;
use App\Services\Dashboard\PublicDashboardService;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(AdminDashboardService $dashboard, PublicDashboardService $publicDashboard): Response
    {
        return Inertia::render('admin/dashboard', [
            'dashboard' => $dashboard->getData(),
            'publicDashboard' => $publicDashboard->getData(detailed: true),
        ]);
    }
}

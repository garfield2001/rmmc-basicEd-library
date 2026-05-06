<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\AdminDashboardService;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(AdminDashboardService $dashboard): Response
    {
        return Inertia::render('admin/dashboard', [
            'dashboard' => $dashboard->getData(),
        ]);
    }
}

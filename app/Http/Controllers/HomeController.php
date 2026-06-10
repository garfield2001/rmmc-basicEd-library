<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\AdminDashboardService;
use App\Services\Home\HomePageService;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(HomePageService $homePage, AdminDashboardService $dashboard): Response
    {
        $props = [
            'home' => $homePage->data(),
        ];

        if (auth()->user()?->isAdmin()) {
            $props['adminDashboard'] = $dashboard->getData();
        }

        return Inertia::render('index', $props);
    }
}

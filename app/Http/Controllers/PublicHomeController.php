<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\PublicDashboardService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicHomeController extends Controller
{
    public function __invoke(PublicDashboardService $dashboard)
    {
        return Inertia::render('index', [
            'dashboard' => $dashboard->getData(),
        ]);
    }
}

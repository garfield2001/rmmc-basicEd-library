<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\AdminVisitMonitorService;
use Inertia\Inertia;
use Inertia\Response;

class AdminVisitMonitorController extends Controller
{
    public function __invoke(AdminVisitMonitorService $visitMonitor): Response
    {
        return Inertia::render('admin/live-visits', [
            'visitMonitor' => $visitMonitor->getData(),
        ]);
    }
}

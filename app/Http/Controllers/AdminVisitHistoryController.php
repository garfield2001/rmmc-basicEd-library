<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\AdminVisitMonitorService;
use Inertia\Inertia;
use Inertia\Response;

class AdminVisitHistoryController extends Controller
{
    public function __invoke(AdminVisitMonitorService $visitMonitor): Response
    {
        return Inertia::render('admin/visits-history', [
            'visitHistory' => $visitMonitor->getHistoryData(),
        ]);
    }
}

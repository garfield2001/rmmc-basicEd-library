<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\AdminVisitMonitorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

    public function scanTargets(Request $request, AdminVisitMonitorService $visitMonitor): JsonResponse
    {
        return response()->json([
            'targets' => $visitMonitor->searchScanTargets($request->string('search')->toString()),
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\ScanTargetSearchRequest;
use App\Services\Dashboard\AdminVisitMonitorService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class AdminVisitMonitorController extends Controller
{
    public function index(AdminVisitMonitorService $visitMonitor): Response
    {
        return Inertia::render('admin/live-visits', [
            'visitMonitor' => $visitMonitor->getData(),
        ]);
    }

    public function scanTargets(ScanTargetSearchRequest $request, AdminVisitMonitorService $visitMonitor): JsonResponse
    {
        return response()->json([
            'targets' => $visitMonitor->searchScanTargets((string) ($request->validated('search') ?? '')),
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\AdminVisitMonitorService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminVisitProgressController extends Controller
{
    public function index(Request $request, AdminVisitMonitorService $visitMonitor, ?string $audience = null): Response
    {
        $type = $this->visitorType($audience, $request->string('type')->toString());
        $audienceSlug = $audience ?? ($type === 'employee' ? 'employees' : 'students');

        return Inertia::render('admin/visit-progress', [
            'visitLogs' => $visitMonitor->getVisitLogs(),
            'initialVisitorType' => $type,
            'pagePath' => "/admin/visit-progress/{$audienceSlug}",
        ]);
    }

    private function visitorType(?string $audience, string $fallback): string
    {
        return match ($audience) {
            'employees' => 'employee',
            'students' => 'student',
            default => $fallback === 'employee' ? 'employee' : 'student',
        };
    }
}
